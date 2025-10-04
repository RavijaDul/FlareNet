# Flarenet - Transformer Maintenance Record Keeper

Flarenet is a web-based system designed to manage and automate transformer inspections using thermal images. Users can record transformer details, upload baseline and maintenance thermal images, and tag images by environmental conditions such as sunny, cloudy, or rainy. The system allows future phases to implement automated anomaly detection and generate digital maintenance records.  


[![React](https://img.shields.io/badge/React-18%2B-cyan?logo=react&logoColor=white&logoSize=30)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4%2B-pink?logo=vite&logoColor=white&logoSize=30)](https://vitejs.dev/)
[![npm](https://img.shields.io/badge/npm-8%2B-blue?logo=npm&logoColor=white&logoSize=30)](https://www.npmjs.com/)
[![Java](https://img.shields.io/badge/Java-17%2B-orange?logo=java&logoColor=white&logoSize=30)](https://www.oracle.com/java/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue?logo=postgresql&logoColor=white&logoSize=30)](https://www.postgresql.org/)
[![Material UI](https://img.shields.io/badge/Material_UI-5%2B-007FFF?logo=mui&logoColor=white&logoSize=30)](https://mui.com/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3%2B-green?logo=spring&logoColor=white&logoSize=30)](https://spring.io/projects/spring-boot)
[![Docker](https://img.shields.io/badge/Docker-24%2B-2496ED?logo=docker&logoColor=white&logoSize=30)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js&logoColor=white&logoSize=30)](https://nodejs.org/)


---

## Overview

**Flarenet** is a full-stack web application with a **React frontend** and **Spring Boot backend** using **PostgreSQL**.  

- **Frontend:** Built with React, Vite, and Material UI for fast and responsive UI.  
- **Backend:** Spring Boot handles business logic and provides APIs.  
- **Database:** PostgreSQL via Docker Compose stores all data for the system.  

This system is designed to demonstrate **modern web development with a separation of frontend and backend**, and can be extended with features like authentication, CRUD operations, and dashboards.

---

## Dependencies

### Frontend

- React, Vite, Material UI  
- Axios or fetch for API requests  
- Node.js and npm to run scripts  

### Backend

- Java 17+, Spring Boot 3+  
- Spring Data JPA for database interactions  
- PostgreSQL via Docker Compose  
- Maven for dependency management  

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
docker compose down -v
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
docker compose down -v
docker compose up -d

# Start backend
cd flarenet-backend
mvn spring-boot:run

# Start frontend
cd frontend
npm install
npm run dev



# Start python backend
   # Go to backend folder
   cd python-backend

   # Create and activate virtual environment
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate

   # Install dependencies
   pip install -r requirements.txt

   # Optional: download model weights first
   python model_weight.py

   # Run the FastAPI server
   uvicorn app:app --host 0.0.0.0 --port 5000 --reload
```
---

## 📌 Additional Tips

- To stop the DB: `docker compose down`
- To reset the DB: delete `pgdata` volume or run `docker compose down -v` and `docker compose up -d`
- Use Postgres GUI tools (like pgAdmin or DBeaver) to inspect the database if needed

## ⚠️ Limitations & Issues

- Authentication & user roles missing – At this stage, the system does not include authentication, authorization, or multi-user role management. These features will be added in future phases.
- Deployment not yet available – FlareNet currently runs only in a local development environment (Docker + local servers). A cloud deployment setup is not yet provided.




-To change user role
Open DB with pgAdmin or Docker CLI.

docker exec -it flarenet-db psql -U flarenet -d flarenet


Run:

\dt
select * from users;


(you should see your registered users).

Manually promote yourself:

UPDATE users SET role='ADMIN' WHERE username='yourname';

Later, when you move towards production/stable release, you can:

Switch off ddl-auto.

Lock schema with Flyway or Liquibase migrations.