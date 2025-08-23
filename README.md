# Flarenet

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-8%2B-blue?logo=npm&logoColor=white)](https://www.npmjs.com/)
[![Java](https://img.shields.io/badge/Java-17%2B-orange?logo=java&logoColor=white)](https://www.oracle.com/java/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

Full-stack project with a **React (Vite + Material UI)** frontend and a **Spring Boot** backend using **PostgreSQL**.  
Frontend and backend are organized in separate folders. This README provides instructions for setup, running, and understanding the project.

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** 18+  
- **npm** (for frontend)  
- **Java 17+** (for backend / Spring Boot)  
- **PostgreSQL** running locally or remotely  

---

## Setup & Run

### Frontend

```bash
cd frontend
npm install      # Install dependencies
npm run dev       # Start frontend development server
``` 

# Backend
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```
# Database (PostgreSQL)
```bash
CREATE DATABASE flarenet_dev;
```

# Frontend production build
```bash
npm run build
npm run preview
```
# Backend tests
```bash
./mvnw test

```

## Project Structure

### Frontend (frontend/)

- **src/components/ — Reusable UI components

- **src/pages/ — Application pages and routes

- **src/services/ — API calls to backend

### Backend (backend/)

- **src/main/java/.../controllers/ — REST controllers handling HTTP requests

- **src/main/java/.../services/ — Business logic and service layer

- **src/main/java/.../models/ — Entities / data models mapping to database tables

- **src/main/resources/ — Configuration files including application.properties
