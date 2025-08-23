# FlareNet – Phase 1 (Backend Only)

Spring Boot backend for **Transformer & Thermal Image Management** (FR1.1–FR1.3).

## Features
- Transformer CRUD
- Thermal image upload (Baseline / Maintenance)
- Baseline requires weather (Sunny/Cloudy/Rainy)
- File storage on disk; metadata in relational DB (Postgres/MySQL)
- CORS enabled for frontend at http://localhost:5173

## Prerequisites
- Java 17+, Maven
- One database:
  - PostgreSQL 16+ or MySQL 8+
- (Optional) Docker

## Quick Start

### 1) Start a DB (choose one)

**PostgreSQL via Docker**
```bash
docker run --name flarenet-db -e POSTGRES_PASSWORD=flarenet -e POSTGRES_USER=flarenet -e POSTGRES_DB=flarenet -p 5432:5432 -d postgres:16
```

**MySQL via Docker**
```bash
docker run --name flarenet-mysql -e MYSQL_ROOT_PASSWORD=flarenet -e MYSQL_DATABASE=flarenet -e MYSQL_USER=flarenet -e MYSQL_PASSWORD=flarenet -p 3306:3306 -d mysql:8
```

### 2) Run the app (choose the profile to match your DB)
```bash
# PostgreSQL
mvn spring-boot:run -Dspring-boot.run.profiles=postgres

# MySQL
mvn spring-boot:run -Dspring-boot.run.profiles=mysql
```

> Override DB creds with env vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`.

Uploads will be saved under `./uploads/t-{transformerId}/...`.

## API
- `GET    /api/transformers`
- `POST   /api/transformers`
- `GET    /api/transformers/{id}`
- `PUT    /api/transformers/{id}`
- `DELETE /api/transformers/{id}`
- `GET    /api/transformers/{id}/images`
- `POST   /api/transformers/{id}/images` (multipart form):
  - `file`: image file
  - `imageType`: `BASELINE` | `MAINTENANCE`
  - `weatherCondition`: `SUNNY` | `CLOUDY` | `RAINY` (required if `BASELINE`)
  - `uploader`: string

## Notes
- Ensure the `uploads/` folder is writable by the app process.
- Seed transformers are inserted from `src/main/resources/data.sql`.
