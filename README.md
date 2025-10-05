# Flarenet - Transformer Maintenance Record Keeper

Flarenet is a web-based system designed to manage and automate transformer inspections using thermal images. Users can record transformer details, upload baseline and maintenance thermal images, and tag images by environmental conditions such as sunny, cloudy, or rainy. The system includes automated anomaly detection using machine learning models to analyze thermal images and generate digital maintenance records.

**Current Stage: Milestone 02** - Full-stack application with integrated ML inference for anomaly detection.

[![React](https://img.shields.io/badge/React-18%2B-cyan?logo=react&logoColor=white&logoSize=30)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4%2B-pink?logo=vite&logoColor=white&logoSize=30)](https://vitejs.dev/)
[![npm](https://img.shields.io/badge/npm-8%2B-blue?logo=npm&logoColor=white&logoSize=30)](https://www.npmjs.com/)
[![Java](https://img.shields.io/badge/Java-17%2B-orange?logo=java&logoColor=white&logoSize=30)](https://www.oracle.com/java/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue?logo=postgresql&logoColor=white&logoSize=30)](https://www.postgresql.org/)
[![Material UI](https://img.shields.io/badge/Material_UI-5%2B-007FFF?logo=mui&logoColor=white&logoSize=30)](https://mui.com/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3%2B-green?logo=spring&logoColor=white&logoSize=30)](https://spring.io/projects/spring-boot)
[![Docker](https://img.shields.io/badge/Docker-24%2B-2496ED?logo=docker&logoColor=white&logoSize=30)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js&logoColor=white&logoSize=30)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.8%2B-blue?logo=python&logoColor=white&logoSize=30)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-green?logo=fastapi&logoColor=white&logoSize=30)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-red?logo=pytorch&logoColor=white&logoSize=30)](https://pytorch.org/)

---

## Overview

**Flarenet** is a full-stack web application with a **React frontend**, **Spring Boot backend**, **Python ML backend**, and **PostgreSQL database**.

- **Frontend:** Built with React, Vite, and Material UI for fast and responsive UI.
- **Backend:** Spring Boot handles business logic, CRUD operations, and provides REST APIs.
- **ML Backend:** Python FastAPI server for automated anomaly detection on thermal images using PyTorch models.
- **Database:** PostgreSQL via Docker Compose stores transformers, inspections, thermal images, and analysis results.

This system demonstrates **modern full-stack development with AI integration**, including user authentication, CRUD operations, image upload/management, and ML-powered analysis.

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

### Python ML Backend

- Python 3.8+
- FastAPI, PyTorch
- OpenCV, Pillow for image processing
- Uvicorn for server

---

## 🚀 Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/RavijaDul/FlareNet.git
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

To explore the database(Optional)
```bash
docker exec -it flarenet-db psql -U flarenet -d flarenet
```
---

### 3. Run the JAVA Backend
Navigate to the backend folder and start the Spring Boot server:

```bash
cd flarenet-backend
mvn spring-boot:run
```
# Electrical / Transformer Thermal Anomaly Detection – End‑to‑End Documentation

This repository provides an end‑to‑end workflow for detecting thermal anomalies (loose joints, wire overloads, localized hot spots) in transformer / electrical component images using a pretrained PatchCore model (Wide ResNet50 backbone) plus deterministic OpenCV post‑processing and rule‑based classification.

---
## Overview
Transformer thermal anomaly detection system achieving strong precision/recall tradeoff while maintaining complete explainability of post‑processing logic.

---
## Performance Metrics
| Metric | Value | Description |
|--------|-------|-------------|
| AUROC | 88.7% | Area under ROC curve (image/region level) |
| F1-Score | 91.6% | Harmonic mean of precision & recall (fault classification) |
| Inference Accuracy | 100% | All faulty images flagged (no false negatives) |
| Processing Speed | 1.77 FPS | Average end‑to‑end throughput (Python, single GPU/CPU mix) |

Expected (reference environment):
* Training (1 epoch) ≈ 20 minutes
* Test batch run ≈ 40 seconds
* Reported stats (single validation set) ≈ above table

Average performance baseline used: percentage threshold calibration anchored at 40% (see Calibration section) for internal acceptance testing
The backend API will be available at `http://localhost:8080/api`.

---
### 4. Run the python backend
```bash
cd python-backend
python -m venv venv

venv\Scripts\activate   # Windows:
source venv/bin/activate    # macOS/Linux:

pip install -r requirements.txt
python model_weight.py
uvicorn app:app --host 0.0.0.0 --port 5000 --reload
```
---
### 5. Run the Frontend
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
├── python-backend/
│   ├── app.py                  # FastAPI server for ML inference
│   ├── model_core.py           # ML model loading and inference logic
│   ├── model_weight.py         # Script to download model weights
│   ├── requirements.txt        # Python dependencies
│   └── test_request.py         # Test script for API
└── README.md
```

---

## ⚙️ Notes for Teammates

1. **Images:**  
   All thermal images are stored in `flarenet-backend/uploads/`. This folder is mounted in Docker, so images are accessible to the backend.

2. **Database:**
   - Tables: `users`, `transformers`, `inspections`, `thermal_image`, `analysis_result`
   - The database will be automatically created on first Docker run.

3. **Environment variables (optional):**
   Customize DB credentials in `docker-compose.yml`. Backend `application.yml` should matches these credentials.

4. **Model Training and Inference:**
   For Milestone 02, the Python backend includes inference capabilities. Model training and detailed inference testing are available in a separate repository (link to be provided later). The current setup uses pre-trained models for anomaly detection.

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