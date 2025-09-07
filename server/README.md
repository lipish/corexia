Corexia Server (Rust + PostgreSQL)

A lightweight Axum + SQLx backend that manages datasets and links them to finetune jobs.

Endpoints
- GET /healthz – health check
- GET /datasets – list datasets
- POST /datasets – create dataset (optionally with samples)
- GET /datasets/:id – get dataset by id
- POST /datasets/:id/samples – append samples to dataset
- POST /finetunes/:finetune_id/datasets/:dataset_id – link a dataset to a finetune

Quick start
1) Prepare database
- Create a PostgreSQL database and set DATABASE_URL
- Optionally add .env with DATABASE_URL

2) Run migrations (requires sqlx-cli)
- cargo install sqlx-cli
- cd server && sqlx migrate run

3) Run server
- cd server
- cargo run
- Server listens on 0.0.0.0:8080 by default

Environment
- DATABASE_URL: postgres connection string, e.g. postgres://user:pass@localhost:5432/corexia
- RUST_LOG: tracing filter, e.g. info,debug
- SERVER_ADDR: optional, default 0.0.0.0:8080

Notes
- CORS is enabled for http://localhost:3000 by default for local frontend
- UUIDs are generated client-side by the app; database stores as uuid

