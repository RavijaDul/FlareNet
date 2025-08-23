# Flarenet

Full-stack project with a **React (Vite + Material UI)** frontend and a **Spring Boot** backend using **PostgreSQL**.  
Frontend and backend are organized in separate folders.

---

To get started, make sure you have the following installed and running:

- **Node.js** 18+ (20+ recommended)  
- **npm** (for frontend)  
- **Java 17+** (for backend / Spring Boot)  
- **PostgreSQL**  

---

### Frontend Setup

Install dependencies and start the development server:

```bash
cd frontend
npm install
npm run dev

# Backend
cd backend
./mvnw clean install
./mvnw spring-boot:run

# Database (PostgreSQL)
CREATE DATABASE flarenet_dev;

# Frontend production build
npm run build
npm run preview

# Backend tests
./mvnw test
