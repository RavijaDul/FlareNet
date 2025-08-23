# Flarenet

Full-stack project with a **React (Vite + Material UI)** frontend and a **Spring Boot** backend using **PostgreSQL**.  
This README provides instructions for setup, running, and understanding the project.

---

## Quick Setup & Run

Follow the steps below. All commands can be copy-pasted sequentially in your terminal.

```bash
# 1. Database Setup
# Ensure PostgreSQL is running and create the development database
psql -U your_db_user -c "CREATE DATABASE flarenet_dev;"

# Update database connection in backend/src/main/resources/application.properties:
# spring.datasource.url=jdbc:postgresql://localhost:5432/flarenet_dev
# spring.datasource.username=your_db_user
# spring.datasource.password=your_db_password
# spring.jpa.hibernate.ddl-auto=update

# 2. Backend Setup
cd backend
./mvnw clean install      # Build backend
./mvnw spring-boot:run    # Run backend server (tables auto-created)
./mvnw test               # Run backend tests

# 3. Frontend Setup
cd ../frontend
npm install                # Install frontend dependencies
npm run dev                # Start frontend development server

# Open frontend in browser at http://localhost:5173
# Open backend in browser at http://localhost:8080

# Frontend production build
npm run build              # Build production files
npm run preview            # Preview production build


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
