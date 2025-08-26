# Flarenet - Transformer Maintenance Record Keeper

Flarenet is a web-based system designed to manage and automate transformer inspections using thermal images. Users can record transformer details, upload baseline and maintenance thermal images, and tag images by environmental conditions such as sunny, cloudy, or rainy. The system allows future phases to implement automated anomaly detection and generate digital maintenance records.  


<p align="center">
  <div align="center" style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">
    
  <div align="center">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="60" height="60"/>
    <br/>
    <sub><b>Node.js</b></sub>
  </div>
  
  <div align="center">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/npm/npm-original-wordmark.svg" width="60" height="60"/>
    <br/>
    <sub><b>npm</b></sub>
  </div>
  
  <div align="center">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" width="60" height="60"/>
    <br/>
    <sub><b>Java</b></sub>
  </div>
  
  <div align="center">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="60" height="60"/>
    <br/>
    <sub><b>PostgreSQL</b></sub>
  </div>
  
  <div align="center">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="60" height="60"/>
    <br/>
    <sub><b>React</b></sub>
  </div>
  
  <div align="center">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vite/vite-original.svg" width="60" height="60"/>
    <br/>
    <sub><b>Vite</b></sub>
  </div>
  
  <div align="center">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/materialui/materialui-original.svg" width="60" height="60"/>
    <br/>
    <sub><b>Material UI</b></sub>
  </div>
  
  <div align="center">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg" width="60" height="60"/>
    <br/>
    <sub><b>Spring Boot</b></sub>
  </div>
  
  <div align="center">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" width="60" height="60"/>
    <br/>
    <sub><b>Docker</b></sub>
  </div>

  </div>
</p>


---

## Overview

**Flarenet** is a full-stack web application with a **React frontend** and **Spring Boot backend** using **PostgreSQL**.  

- **Frontend:** Built with React, Vite, and Material UI for fast and responsive UI.  
- **Backend:** Spring Boot handles business logic and provides REST APIs.  
- **Database:** PostgreSQL stores all data for the system.  

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
- PostgreSQL JDBC driver  
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
