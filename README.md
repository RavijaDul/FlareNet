# Flarenet - Transformer Maintenance Record Keeper

Flarenet is a web-based system designed to manage and automate transformer inspections using thermal images. Users can record transformer details, upload baseline and maintenance thermal images, and tag images by environmental conditions such as sunny, cloudy, or rainy. The system includes automated anomaly detection using machine learning models to analyze thermal images and generate digital maintenance records.

**Current Stage: Milestone 05** - Production-ready system with **normalized database architecture**, **role-based access control**, **inspection record management**, **PDF report generation**, and **history tracking** capabilities.

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
[![OpenCV](https://img.shields.io/badge/OpenCV-4.8%2B-blue?logo=opencv&logoColor=white&logoSize=30)](https://opencv.org/) 
[![ResNet](https://img.shields.io/badge/Deep_Learning-ResNet-red?logo=keras&logoColor=white&logoSize=30)](https://arxiv.org/abs/1512.03385) 
[![Transfer Learning](https://img.shields.io/badge/Transfer_Learning-Enabled-purple?logo=tensorflow&logoColor=white&logoSize=30)](https://www.tensorflow.org/tutorials/images/transfer_learning)

---

## Overview

**Flarenet** is a full-stack web application with a **React frontend**, **Spring Boot backend**, **Python ML backend**, and **PostgreSQL database**.

- **Frontend:** Built with React, Vite, and Material UI for fast and responsive UI with role-based component rendering.
- **Backend:** Spring Boot handles business logic, CRUD operations, REST APIs, and enforces engineer-only access control at the API layer.
- **ML Backend:** Python FastAPI server for automated anomaly detection on thermal images using PyTorch models with adaptive learning.
- **Database:** PostgreSQL with normalized relational schema deployed on Supabase cloud platform for production scalability.

This system demonstrates **modern full-stack development with AI integration**, including role-based authentication, CRUD operations, image upload/management, ML-powered analysis, **human-in-the-loop adaptive learning**, automated PDF report generation, and comprehensive inspection history tracking.

---

## Dependencies

### Frontend

- React, Vite, Material UI
- Axios or fetch for API requests
- Node.js and npm to run scripts

### Backend

- Java 17+, Spring Boot 3+
- Spring Data JPA for database interactions
- PostgreSQL via Docker Compose (local) / Supabase (production)
- Maven for dependency management
- iText library for PDF report generation

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

### 2. Start Postgres with Docker (Recommended)
We use Docker to run Postgres with schema and seed data automatically.

```bash
docker compose down -v
docker compose up -d
```

- Database: `flarenet`  
- User: `flarenet`  
- Password: `flarenet`  
- Port: `5432`  

#### Alternative: Manual PostgreSQL Setup
If Docker containers have issues, you can run PostgreSQL manually:

1. **Install PostgreSQL locally** (version 14+)
2. **Create database:**
   ```sql
   CREATE DATABASE flarenet;
   CREATE USER flarenet WITH PASSWORD 'flarenet';
   GRANT ALL PRIVILEGES ON DATABASE flarenet TO flarenet;
   ```
3. **Run schema setup:**
   ```bash
   psql -U flarenet -d flarenet -f flarenet-backend/db/init.sql
   ```
4. **Update connection:** Modify `flarenet-backend/src/main/resources/application.yml` if using different credentials.

#### Database Exploration (Optional)
```bash
# Via Docker
docker exec -it flarenet-db psql -U flarenet -d flarenet

# Via local PostgreSQL + pgAdmin
# Install pgAdmin and connect to localhost:5432 with credentials above
```
---

### 3. Run the JAVA Backend
Navigate to the backend folder and start the Spring Boot server:

```bash
cd flarenet-backend
mvn spring-boot:run
```
# Electrical / Transformer Thermal Anomaly Detection – End‑to‑End Documentation

This provides an end‑to‑end workflow for detecting thermal anomalies (loose joints, wire overloads, localized hot spots) in transformer / electrical component images using a pretrained PatchCore model (Wide ResNet50 backbone) plus deterministic OpenCV post‑processing and rule‑based classification.

Patchcore anomalib guidlines: https://anomalib.readthedocs.io/en/v2.0.0/markdown/guides/reference/models/image/patchcore.html 

Model Training and Inference Explanation Documentation: https://drive.google.com/file/d/1rH2tm_9AG-j8Pgugy6kL4hvsKc8s6xXF/view?usp=sharing 

---
## Overview
Transformer thermal anomaly detection system achieving strong precision/recall tradeoff while maintaining complete explainability of post‑processing logic.

Implemented ResNet-50, a deep neural network with 50 layers that uses residual
connections to solve the vanishing gradient problem. For training, we used transfer
learning - starting with pre-trained weights from ImageNet and fine-tuning on our
specific dataset. Through iterative gradient descent optimization, the network minimized
classification loss while the residual blocks preserved important information flow.

Model Tested Repository: https://github.com/RavijaDul/flarenet-ml.git


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

Some Tested examples: https://drive.google.com/file/d/1oB7vqYwXO6YeScPZUGsK__g6Zrj72mPX/view?usp=sharing 
(Segmented + OpenCV processed + Reconstructed)

---

##  Adaptive Learning System

FlareNet now includes an **adaptive learning system** that improves anomaly detection accuracy through user feedback without retraining the core AI model.

### How It Works
1. **User Corrections**: When users modify detection results (add/delete/resize annotations), the system captures this as feedback
2. **Smart Adaptation**: Mathematical algorithms adjust detection sensitivity and classification parameters based on correction patterns
3. **Real-time Learning**: Parameters update immediately, improving future detections on similar images
4. **Comprehensive Tracking**: All parameter changes are logged in JSON/CSV format for analysis

### User Modifications Detected & Tuned
-  **False Negatives**: User adds missing anomalies → Increases detection sensitivity
-  **False Positives**: User deletes incorrect detections → Reduces sensitivity  
-  **Bounding Box Resize**: User adjusts detection areas → Refines geometric rules
-  **Severity Changes**: User corrects fault levels → Adjusts color classification thresholds
-  **Category Changes**: User fixes anomaly types → Logs for pattern analysis

### Mathematical Approach
The system uses **statistical threshold adaptation** without touching the trained PatchCore model:

```
Detection Threshold = Mean(Anomaly_Map) + K × StdDev(Anomaly_Map)
K = 1.1 + (sensitivity_percentage / 100) × 1.0
```

- **Lower K** = More sensitive (catches subtle anomalies)
- **Higher K** = Less sensitive (reduces false positives)
- **Adaptive tuning** based on user correction patterns

### What Users Can Do
- **Annotate freely**: All corrections automatically improve the system
- **Reset parameters**: Return to default settings anytime via frontend button
- **Track progress**: View parameter evolution and system learning trends
- **Export data**: Download adaptation logs for analysis

##  Adaptive Learning Documentation

For detailed technical documentation of the adaptive learning system, including mathematical formulas, API specifications, and troubleshooting guides, see:

- Comprehensive end-to-end documentation - https://drive.google.com/file/d/1oA-8hFX2DrHVppWEXoII6MKevlmYXRBY/view?usp=sharing
  
- Detailed mathematical foundations and algorithms - https://drive.google.com/file/d/11qzIu_VQUKz2LG4rBHGnmAWeGZ505ezP/view?usp=sharing

---
### 4. Run the python backend
```bash
cd python-backend
python -m venv venv

# Activate virtual environment
venv\Scripts\activate           # Windows
source venv/bin/activate        # macOS/Linux

pip install -r requirements.txt
python model_weight.py          # Download AI model weights
uvicorn app:app --host 0.0.0.0 --port 5000 --reload
```

#### Adaptive Parameter Management
The Python backend now includes adaptive learning capabilities. Key scripts:

- `adaptive_params.py` - Core parameter management and adaptation logic
- `feedback_handler.py` - Processes user corrections and determines adaptations
- `parameter_tracker.py` - Logs all parameter changes with visualization
- `param_manager.py` - Command-line tool for parameter management

#### Reset Parameters (if needed)
```bash
# Quick reset to defaults
python -c "from adaptive_params import adaptive_params; adaptive_params.reset_to_defaults()"

# Or using parameter manager
python param_manager.py --reset

# View current parameters
python param_manager.py --show
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
│   ├── adaptive_params.py      # Adaptive parameter management system
│   ├── feedback_handler.py     # User feedback analysis and processing
│   ├── parameter_tracker.py    # Parameter change tracking and visualization
│   ├── param_manager.py        # Command-line parameter management tool
│   ├── model_weight.py         # Script to download model weights
│   ├── requirements.txt        # Python dependencies
│   ├── feedback_data/          # User feedback and parameter logs
│   ├── parameter_tracking/     # CSV/JSON logs and trend visualizations
│   └── test_request.py         # Test script for API
└── README.md
```

---

## Database Architecture

FlareNet uses a **normalized relational database schema** designed for efficient querying and reporting capabilities. The database is deployed on **Supabase** (PostgreSQL cloud platform) for production use.

### Core Tables

```
transformers
├── id (PK)
├── transformer_no
├── region
├── pole_no
├── type
├── location_details
├── capacity_kva
└── timestamps

inspections
├── id (PK)
├── transformer_id (FK)
├── inspection_number
├── inspected_date
├── inspection_time
├── branch
├── status (PENDING/IN_PROGRESS/COMPLETED)
└── timestamps

thermal_image
├── id (PK)
├── inspection_id (FK)
├── transformer_id (FK)
├── file_name
├── file_path
├── image_type (BASELINE/MAINTENANCE)
├── weather_condition
├── uploader
└── uploaded_at

analysis_result
├── id (PK)
├── thermal_image_id (FK)
├── status (Normal/Anomalies)
├── total_detections
├── critical_count
├── potentially_faulty_count
├── result_json
└── analyzed_at

detection
├── id (PK)
├── analysis_result_id (FK)
├── label
├── category (loose_joint/wire_overload/point_overload)
├── severity (Critical/Faulty/Potentially Faulty)
├── confidence
├── bbox (x, y, width, height)
└── created_at

user_annotations
├── id (PK)
├── thermal_image_id (FK)
├── user_id
├── annotations_json
└── created_at

annotation_action
├── id (PK)
├── user_annotation_id (FK)
├── detection_id (FK)
├── action_type (ADDED/EDITED/DELETED/CONFIRMED)
├── original_* (label, category, severity, confidence, bbox)
├── new_* (label, category, severity, confidence, bbox)
├── bbox_modified
└── created_at
```

### Database Design Principles

**Normalization Benefits:**
- Structured columns replace JSON text storage for efficient SQL queries
- Foreign key relationships ensure referential integrity
- Indexed columns (transformer_id, inspection_id, severity, category) optimize reporting
- Separate `detection` table enables fast filtering by anomaly type without JSON parsing
- `annotation_action` table tracks user feedback with before/after values for adaptive learning

**Deployment:**
- **Local Development:** PostgreSQL via Docker Compose (port 5432)
- **Production:** Supabase cloud platform with automatic backups and SSL connections
- **Connection Pooling:** HikariCP manages database connections efficiently (max 10 connections)

---

## Role-Based Access Control

FlareNet implements **engineer-only access** for critical operations to ensure data integrity and proper maintenance workflows.

### Access Restrictions

**Engineer Role Required:**
- Create/edit inspection records
- Upload thermal images
- Run AI analysis
- Save annotations and corrections
- Generate PDF reports

**Implementation:**
- **Frontend:** Role check hides "Add Inspection" and "Upload Image" buttons for non-engineers
- **Backend:** Java Spring Security validates user role in API controllers before processing requests
- **Database:** User role stored in `users` table, verified during login and cached in session

**Login Flow:**
```
User Login → Backend validates credentials → Checks role in database → Returns user object with role → Frontend renders UI based on role
```

Only users with `role = 'ENGINEER'` can access maintenance-related endpoints. Unauthorized requests return HTTP 403 Forbidden.

---

## Inspection Record Management

FlareNet provides comprehensive inspection lifecycle management with automated record generation from AI analysis results.

### Workflow

1. **Create Inspection:** Engineer creates inspection record for a transformer (inspection number, date, branch, status)
2. **Upload Images:** Engineer uploads thermal images (baseline/maintenance) tagged with weather conditions
3. **AI Analysis:** System analyzes images using PatchCore model, populates `analysis_result` and `detection` tables
4. **User Annotation:** Engineer reviews AI detections, makes corrections (add/edit/delete annotations)
5. **Adaptive Learning:** System processes feedback via `annotation_action` table, adjusts detection parameters
6. **Generate Report:** Engineer generates PDF report with embedded images, detection overlays, and maintenance summary
7. **History Tracking:** All inspections chronologically ordered per transformer for trend analysis

### Automated Record Population

**From AI Analysis:**
- Analysis summary saved to `analysis_result` (status, total detections, critical count)
- Individual anomalies saved to `detection` table (label, category, severity, confidence, bounding box)

**From User Annotations:**
- Original AI detections vs. user corrections compared automatically
- Action type classified (ADDED/EDITED/DELETED/CONFIRMED)
- Before/after values saved to `annotation_action` table
- Feedback sent to Python backend for adaptive parameter tuning

---

## PDF Report Generation

FlareNet generates professional inspection reports using **iText library** for PDF creation.

### Report Contents

- Transformer details (ID, region, location, capacity)
- Inspection metadata (number, date, time, branch, status)
- Embedded thermal images with detection bounding boxes overlaid
- Analysis summary (total detections, critical count, severity breakdown)
- Detailed anomaly list (label, category, severity, confidence, location)
- User annotation summary (corrections made, detections added/deleted)
- Engineer signature and timestamp

### Technical Implementation

**PDF Generation Process:**
```
Inspection Record → Query database (joins: inspections, thermal_image, analysis_result, detection) 
→ Load image files from uploads folder → Embed images in PDF 
→ Draw detection bounding boxes on images → Add tables with anomaly details 
→ Return PDF file (Content-Type: application/pdf)
```

**Sample Report:** [View Sample PDF](https://drive.google.com/your-pdf-link-here)

**Features:**
- High-resolution image embedding (300 DPI)
- Color-coded severity levels (Red: Critical, Orange: Faulty, Yellow: Potentially Faulty)
- Professional layout with company branding
- Pagination and table of contents for multi-page reports

---

## History Viewer

Transformer inspection history provides chronological tracking of all maintenance activities.

### Navigation Features

- **Timeline View:** All inspections ordered by date (newest first)
- **Status Indicators:** Visual badges for PENDING/IN_PROGRESS/COMPLETED status
- **Quick Stats:** Image count and anomaly count per inspection displayed inline
- **Detail Navigation:** Click any inspection to view full details, images, and detections
- **Report Access:** Direct download link for generated PDF reports
- **Trend Analysis:** Compare anomaly counts across multiple inspections to identify recurring issues

### Database Query

```sql
SELECT i.*, COUNT(ti.id) as image_count, SUM(ar.total_detections) as total_anomalies
FROM inspections i
LEFT JOIN thermal_image ti ON i.id = ti.inspection_id
LEFT JOIN analysis_result ar ON ti.id = ar.thermal_image_id
WHERE i.transformer_id = ?
GROUP BY i.id
ORDER BY i.inspected_date DESC;
```

History viewer enables engineers to track transformer health over time and identify patterns in thermal anomalies.

---

## ⚙️ Notes for Teammates

1. **Images:**  
   All thermal images are stored in `flarenet-backend/uploads/`. This folder is mounted in Docker, so images are accessible to the backend.

2. **Database:**
   - **Schema:** Normalized relational tables (8 core tables with foreign key relationships)
   - **Local:** PostgreSQL via Docker Compose (automatically created on first run)
   - **Production:** Supabase cloud platform with SSL connections
   - **Indexes:** Optimized for queries on transformer_id, inspection_id, severity, category, action_type

3. **Access Control:**
   - Engineer role required for inspection operations (enforced in Java backend)
   - Frontend checks user role to show/hide buttons
   - Backend validates role in API controllers before processing

4. **Environment variables (optional):**
   Customize DB credentials in `docker-compose.yml`. Backend `application.yml` should match these credentials.

5. **Adaptive Learning & Model Integration:**
   The system combines pre-trained PatchCore models with adaptive parameter tuning. User feedback automatically improves detection without retraining the core AI model. All parameter changes are tracked and can be reset to defaults anytime.

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



# Start python backend with adaptive learning
cd python-backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # macOS/Linux

# Install dependencies (includes matplotlib for visualization)
pip install -r requirements.txt

# Download model weights
python model_weight.py

# Run the FastAPI server with adaptive capabilities
uvicorn app:app --host 0.0.0.0 --port 5000 --reload

# Optional: Manage adaptive parameters
python param_manager.py --show     # View current parameters
python param_manager.py --reset    # Reset to defaults
python param_manager.py --stats    # Show adaptation statistics
```
---

## 📌 Additional Tips

- To stop the DB: `docker compose down`
- To reset the DB: delete `pgdata` volume or run `docker compose down -v` and `docker compose up -d`
- Use Postgres GUI tools (like pgAdmin or DBeaver) to inspect the database if needed


## ⚠️ Limitations & Known Issues

- JWT authentication pending – Current implementation uses basic session-based authentication; token-based auth (JWT) will be added for enhanced security.
- Mobile optimization needed – UI optimized for desktop browsers; responsive design for tablets and mobile devices in progress.
- Adaptive learning requires user interaction – The system improves over time through user feedback; initial performance depends on base model accuracy.
- Cloud deployment in progress – Database deployed on Supabase; full application deployment (frontend + backend) on AWS/Azure pending.
