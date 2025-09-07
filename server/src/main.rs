use std::{env, net::SocketAddr};

use axum::{extract::State, routing::{get, post, delete}, Json, Router};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool};
use tower_http::{cors::{Any, CorsLayer}, trace::TraceLayer};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Clone)]
struct AppState {
    pool: PgPool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Dataset {
    id: Uuid,
    name: String,
    description: Option<String>,
    tags: Vec<String>,
    samples_count: i32,
    size_bytes: i64,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[derive(Deserialize)]
struct CreateDatasetReq {
    name: String,
    description: Option<String>,
    tags: Option<Vec<String>>,
    samples: Option<Vec<serde_json::Value>>, // optional initial samples
}

#[derive(Serialize)]
struct CreateDatasetResp {
    dataset: Dataset,
    added_samples: usize,
}

#[derive(Deserialize)]
struct AddSamplesReq {
    samples: Vec<serde_json::Value>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let db_url = env::var("DATABASE_URL")?;
    let cors_origin = env::var("CORS_ORIGIN").unwrap_or_else(|_| "http://localhost:3000".to_string());
    let addr: SocketAddr = env::var("SERVER_ADDR")
        .unwrap_or_else(|_| "0.0.0.0:8080".to_string())
        .parse()?;

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&db_url)
        .await?;

    // Run migrations at startup (idempotent)
    sqlx::migrate!("./migrations").run(&pool).await?;

    let state = AppState { pool };

    let cors = CorsLayer::new()
        .allow_origin(cors_origin.parse::<http::HeaderValue>().ok())
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/healthz", get(health))
        .route("/datasets", get(list_datasets).post(create_dataset))
        .route("/datasets/:id", get(get_dataset).delete(delete_dataset))
        .route("/datasets/:id/samples", post(add_samples))
        .route("/finetunes/:fid/datasets/:did", post(link_dataset_to_finetune))
        .with_state(state)
        .layer(TraceLayer::new_for_http())
        .layer(cors);

    tracing::info!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;
    Ok(())
}

async fn health() -> &'static str { "ok" }

async fn list_datasets(State(state): State<AppState>) -> anyhow::Result<Json<Vec<Dataset>>> {
    let recs: Vec<Dataset> = sqlx::query_as!(
        Dataset,
        r#"
        SELECT id, name, description, tags, samples_count, size_bytes,
               created_at, updated_at
        FROM datasets
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(&state.pool)
    .await?;
    Ok(Json(recs))
}

async fn get_dataset(State(state): State<AppState>, axum::extract::Path(id): axum::extract::Path<Uuid>) -> anyhow::Result<Json<Dataset>> {
    let rec = sqlx::query_as!(
        Dataset,
        r#"
        SELECT id, name, description, tags, samples_count, size_bytes, created_at, updated_at
        FROM datasets WHERE id = $1
        "#,
        id
    )
    .fetch_one(&state.pool)
    .await?;
    Ok(Json(rec))
}

async fn create_dataset(State(state): State<AppState>, Json(body): Json<CreateDatasetReq>) -> anyhow::Result<Json<CreateDatasetResp>> {
    let id = Uuid::new_v4();
    let tags = body.tags.unwrap_or_default();
    let rec = sqlx::query_as!(
        Dataset,
        r#"
        INSERT INTO datasets (id, name, description, tags)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, description, tags, samples_count, size_bytes, created_at, updated_at
        "#,
        id, body.name, body.description, &tags[..]
    )
    .fetch_one(&state.pool)
    .await?;

    let mut added = 0usize;
    if let Some(samples) = body.samples {
        for s in samples {
            sqlx::query!("INSERT INTO dataset_samples (dataset_id, content) VALUES ($1, $2)", id, s)
                .execute(&state.pool)
                .await?;
            added += 1;
        }
        // update samples_count
        sqlx::query!(
            "UPDATE datasets SET samples_count = samples_count + $1, updated_at = now() WHERE id = $2",
            added as i64,
            id
        )
        .execute(&state.pool)
        .await?;
    }

    // fetch updated
    let rec = sqlx::query_as!(
        Dataset,
        r#"SELECT id, name, description, tags, samples_count, size_bytes, created_at, updated_at FROM datasets WHERE id=$1"#,
        id
    )
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(CreateDatasetResp { dataset: rec, added_samples: added }))
}

async fn add_samples(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
    Json(body): Json<AddSamplesReq>,
) -> anyhow::Result<Json<CreateDatasetResp>> {
    let mut added = 0usize;
    for s in body.samples {
        sqlx::query!("INSERT INTO dataset_samples (dataset_id, content) VALUES ($1, $2)", id, s)
            .execute(&state.pool)
            .await?;
        added += 1;
    }
    sqlx::query!(
        "UPDATE datasets SET samples_count = samples_count + $1, updated_at = now() WHERE id = $2",
        added as i64,
        id
    )
    .execute(&state.pool)
    .await?;

    let rec = sqlx::query_as!(
        Dataset,
        r#"SELECT id, name, description, tags, samples_count, size_bytes, created_at, updated_at FROM datasets WHERE id=$1"#,
        id
    )
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(CreateDatasetResp { dataset: rec, added_samples: added }))
}

async fn link_dataset_to_finetune(
    State(state): State<AppState>,
    axum::extract::Path((fid, did)): axum::extract::Path<(Uuid, Uuid)>,
) -> anyhow::Result<Json<serde_json::Value>> {
    // Ensure finetune exists (create minimal row if not present)
    sqlx::query!(
        r#"INSERT INTO finetunes (id) VALUES ($1) ON CONFLICT (id) DO NOTHING"#,
        fid
    )
    .execute(&state.pool)
    .await?;

    sqlx::query!(
        r#"INSERT INTO finetune_datasets (finetune_id, dataset_id) VALUES ($1, $2) ON CONFLICT DO NOTHING"#,
        fid,
        did
    )
    .execute(&state.pool)
    .await?;

    Ok(Json(serde_json::json!({"ok": true, "finetune_id": fid, "dataset_id": did})))
}



async fn delete_dataset(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> anyhow::Result<Json<serde_json::Value>> {
    sqlx::query!("DELETE FROM datasets WHERE id = $1", id)
        .execute(&state.pool)
        .await?;
    Ok(Json(serde_json::json!({"ok": true, "id": id})))
}
