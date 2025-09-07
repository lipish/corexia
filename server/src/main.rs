use std::{env, net::SocketAddr, collections::HashMap, sync::Arc};

use axum::{extract::State, middleware::{from_fn_with_state, Next}, response::Response, routing::{get, post, delete}, Json, Router};

use axum::http::{StatusCode, Request};
use axum::body::Body;
use tokio::net::TcpListener;
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool};
use tower_http::{cors::{Any, CorsLayer}, trace::TraceLayer};
use uuid::Uuid;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};

#[derive(Clone)]
struct AppState {
    pool: PgPool,
    tokens: Arc<RwLock<HashMap<String, LoginUser>>>,
}

#[derive(Serialize, Deserialize, Debug, Clone, sqlx::FromRow)]
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

    let state = AppState { pool, tokens: Arc::new(RwLock::new(HashMap::new())) };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let protected = Router::new()
        .route("/datasets", get(list_datasets).post(create_dataset))
        .route("/datasets/:id", get(get_dataset).delete(delete_dataset))
        .route("/datasets/:id/samples", post(add_samples))
        .route("/finetunes/:fid/datasets/:did", post(link_dataset_to_finetune))
        .layer(from_fn_with_state(state.clone(), require_auth));

    let app = Router::new()
        .route("/healthz", get(health))
        .route("/auth/login", post(auth_login))
        .merge(protected)
        .with_state(state)
        .layer(TraceLayer::new_for_http())
        .layer(cors);

    tracing::info!("listening on {}", addr);
    let listener = TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}

async fn health() -> &'static str { "ok" }

#[derive(Deserialize)]
struct LoginReq { email: String, password: String }

#[derive(Serialize)]
struct LoginResp { token: String, user: LoginUser }

#[derive(Serialize)]
struct LoginUser { name: String, email: String }

async fn auth_login(State(state): State<AppState>, Json(body): Json<LoginReq>) -> Result<Json<LoginResp>, StatusCode> {
    if body.email.trim().is_empty() {
        return Err(StatusCode::UNAUTHORIZED);
    }
    let name = body.email.split('@').next().unwrap_or("user").to_string();
    let token = Uuid::new_v4().to_string();
    {
        let mut guard = state.tokens.write().await;
        guard.insert(token.clone(), LoginUser { name: name.clone(), email: body.email.clone() });
    }
    Ok(Json(LoginResp { token, user: LoginUser { name, email: body.email } }))
}

async fn require_auth(State(state): State<AppState>, req: Request<Body>, next: Next) -> Result<Response, StatusCode> {
    let Some(auth) = req.headers().get(axum::http::header::AUTHORIZATION) else { return Err(StatusCode::UNAUTHORIZED) };
    let Ok(s) = auth.to_str() else { return Err(StatusCode::UNAUTHORIZED) };
    let Some(token) = s.strip_prefix("Bearer ") else { return Err(StatusCode::UNAUTHORIZED) };
    let guard = state.tokens.read().await;
    if !guard.contains_key(token) { return Err(StatusCode::UNAUTHORIZED) }
    drop(guard);
    Ok(next.run(req).await)
}

async fn list_datasets(State(state): State<AppState>) -> Result<Json<Vec<Dataset>>, StatusCode> {
    let recs: Vec<Dataset> = sqlx::query_as::<_, Dataset>(
        r#"
        SELECT id, name, description, tags, samples_count, size_bytes,
               created_at, updated_at
        FROM datasets
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(recs))
}

async fn get_dataset(State(state): State<AppState>, axum::extract::Path(id): axum::extract::Path<Uuid>) -> Result<Json<Dataset>, StatusCode> {
    let rec = sqlx::query_as::<_, Dataset>(
        r#"
        SELECT id, name, description, tags, samples_count, size_bytes, created_at, updated_at
        FROM datasets WHERE id = $1
        "#
    )
    .bind(id)
    .fetch_one(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(rec))
}

async fn create_dataset(State(state): State<AppState>, Json(body): Json<CreateDatasetReq>) -> Result<Json<CreateDatasetResp>, StatusCode> {
    let id = Uuid::new_v4();
    let tags = body.tags.unwrap_or_default();
    let _created: Dataset = sqlx::query_as::<_, Dataset>(
        r#"
        INSERT INTO datasets (id, name, description, tags)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, description, tags, samples_count, size_bytes, created_at, updated_at
        "#
    )
    .bind(id)
    .bind(&body.name)
    .bind(&body.description)
    .bind(&tags)
    .fetch_one(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut added = 0usize;
    if let Some(samples) = body.samples {
        for s in samples {
            sqlx::query("INSERT INTO dataset_samples (dataset_id, content) VALUES ($1, $2)")
                .bind(id)
                .bind(s)
                .execute(&state.pool)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            added += 1;
        }
        // update samples_count
        sqlx::query(
            "UPDATE datasets SET samples_count = samples_count + $1, updated_at = now() WHERE id = $2"
        )
        .bind(added as i64)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    // fetch updated
    let rec: Dataset = sqlx::query_as::<_, Dataset>(
        r#"SELECT id, name, description, tags, samples_count, size_bytes, created_at, updated_at FROM datasets WHERE id=$1"#
    )
    .bind(id)
    .fetch_one(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(CreateDatasetResp { dataset: rec, added_samples: added }))
}

async fn add_samples(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
    Json(body): Json<AddSamplesReq>,
) -> Result<Json<CreateDatasetResp>, StatusCode> {
    let mut added = 0usize;
    for s in body.samples {
        sqlx::query("INSERT INTO dataset_samples (dataset_id, content) VALUES ($1, $2)")
            .bind(id)
            .bind(s)
            .execute(&state.pool)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        added += 1;
    }
    sqlx::query(
        "UPDATE datasets SET samples_count = samples_count + $1, updated_at = now() WHERE id = $2"
    )
    .bind(added as i64)
    .bind(id)
    .execute(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let rec: Dataset = sqlx::query_as::<_, Dataset>(
        r#"SELECT id, name, description, tags, samples_count, size_bytes, created_at, updated_at FROM datasets WHERE id=$1"#
    )
    .bind(id)
    .fetch_one(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(CreateDatasetResp { dataset: rec, added_samples: added }))
}

async fn link_dataset_to_finetune(
    State(state): State<AppState>,
    axum::extract::Path((fid, did)): axum::extract::Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Ensure finetune exists (create minimal row if not present)
    sqlx::query(
        r#"INSERT INTO finetunes (id) VALUES ($1) ON CONFLICT (id) DO NOTHING"#
    )
    .bind(fid)
    .execute(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    sqlx::query(
        r#"INSERT INTO finetune_datasets (finetune_id, dataset_id) VALUES ($1, $2) ON CONFLICT DO NOTHING"#
    )
    .bind(fid)
    .bind(did)
    .execute(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::json!({"ok": true, "finetune_id": fid, "dataset_id": did})))
}



async fn delete_dataset(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    sqlx::query("DELETE FROM datasets WHERE id = $1")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(serde_json::json!({"ok": true, "id": id})))
}
