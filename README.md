# Flarenet

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-8%2B-blue?logo=npm&logoColor=white)](https://www.npmjs.com/)
[![Java](https://img.shields.io/badge/Java-17%2B-orange?logo=java&logoColor=white)](https://www.oracle.com/java/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18%2B-cyan?logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4%2B-pink?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Material UI](https://img.shields.io/badge/Material_UI-5%2B-007FFF?logo=mui&logoColor=white)](https://mui.com/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3%2B-green?logo=spring&logoColor=white)](https://spring.io/projects/spring-boot)

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

## Step-by-Step Setup

### 1. Database

1. Install PostgreSQL.  
2. Create the development database:

```sql
CREATE DATABASE flarenet_dev;
# Update database connection in backend/src/main/resources/application.properties:
# spring.datasource.url=jdbc:postgresql://localhost:5432/flarenet_dev
# spring.datasource.username=your_db_user
# spring.datasource.password=your_db_password
# spring.jpa.hibernate.ddl-auto=update
```
# 2. Backend Setup
``` bash
cd backend
./mvnw clean install      # Build backend
./mvnw spring-boot:run    # Run backend server (tables auto-created)
./mvnw test               # Run backend tests
```
# 3. Frontend Setup
``` bash
cd ../frontend
npm install                # Install frontend dependencies
npm run dev                # Start frontend development server
```
# Open frontend in browser at http://localhost:5173
# Open backend in browser at http://localhost:8080

# Frontend production build
``` bash
npm run build              # Build production files
npm run preview            # Preview production build
```

## Project Structure

### Frontend (frontend/)

- src/components/ — Reusable UI components

- src/pages/ — Application pages and routes

- src/services/ — API calls to backend

### Backend (backend/)

- src/main/java/.../controllers/ — REST controllers handling HTTP requests

- src/main/java/.../services/ — Business logic and service layer

- src/main/java/.../models/ — Entities / data models mapping to database tables

- *src/main/resources/ — Configuration files including application.properties
