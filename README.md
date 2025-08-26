# FlareNet

FlareNet is a full-stack application for managing transformers, inspections, and thermal images. This repository includes the **frontend**, **backend**, and a **Postgres database setup** using Docker.

---

## 🚀 Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-org/FlareNet.git
cd FlareNet
```

---

### 2. Start Postgres with Docker
We use Docker to run Postgres with schema and seed data automatically.

```bash
docker compose up -d
```

- Database: `flarenet`  
- User: `flarenet`  
- Password: `flarenet`  
- Port: `5432`  

Images will be available inside `flarenet-backend/uploads/`.

> **Note:** The first time you run this, Postgres will execute `init.sql` and create all tables and seed data.

---

### 3. Run the Backend
Navigate to the backend folder and start the Spring Boot server:

```bash
cd flarenet-backend
mvn spring-boot:run
```

The backend API will be available at `http://localhost:8080/api`.

---

### 4. Run the Frontend
Navigate to the frontend folder, install dependencies, and start the dev server:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## 🗂️ Project Structure

```
FlareNet/
├── docker-compose.yml          # Docker Compose for Postgres DB
├── flarenet-backend/
│   ├── db/
│   │   └── init.sql            # Database schema + seed data
│   ├── uploads/                # Images folder (mounted in Docker)
│   ├── src/                    # Java backend code
│   └── pom.xml                 # Maven build file
├── frontend/
│   ├── src/                    # React frontend code
│   ├── package.json
│   └── package-lock.json
└── README.md
```

---

## ⚙️ Notes for Teammates

1. **Images:**  
   All thermal images are stored in `flarenet-backend/uploads/`. This folder is mounted in Docker, so images are accessible to the backend.

2. **Database:**  
   - Tables: `transformers`, `inspections`, `thermal_image`  
   - The database will be automatically created on first Docker run.  

3. **Environment variables (optional):**  
   You can customize DB credentials in `docker-compose.yml`. Make sure the backend `application.yml` matches these credentials.

---

## ✅ Quick Commands

```bash
# Start database
docker compose up -d

# Start backend
cd flarenet-backend
mvn spring-boot:run

# Start frontend
cd frontend
npm install
npm run dev
```

---

## 📌 Additional Tips

- To stop the DB: `docker compose down`
- To reset the DB: delete `pgdata` volume or run `docker compose down -v` and `docker compose up -d`
- Use Postgres GUI tools (like pgAdmin or DBeaver) to inspect the database if needed
