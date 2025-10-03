# FlareNet Python ML Backend - Integration Guide

## Architecture Overview
```
Frontend (React) ←→ Java Spring Boot ←→ Python ML Backend
      ↓                    ↓                    ↓
  Display Results     Store in DB        Process with AI
      ↓                    ↓                    ↓
  Show Bounding Boxes  API Responses      Model Inference
```

## Python Backend (THIS PROJECT)
**Purpose**: Pure ML inference service
**Port**: 8001
**Responsibilities**:
- Load PatchCore model
- Process thermal images
- Generate anomaly scores
- Create bounding boxes
- Generate visualizations
- Return JSON responses

## Java Spring Boot Backend (SEPARATE)
**Purpose**: Main application backend
**Port**: 8080
**Responsibilities**:
- Handle frontend requests
- Store data in PostgreSQL
- Call Python ML backend
- Manage transformers & inspections
- Serve images to frontend

## React Frontend (SEPARATE)
**Purpose**: User interface
**Port**: 5173
**Responsibilities**:
- Upload images
- Display ML results
- Show bounding boxes
- Visualize anomalies

## Integration Flow

### 1. Image Upload Process
```
1. User uploads image in React frontend
2. Frontend sends to Java backend (/api/transformers/{id}/images)
3. Java backend saves image and calls Python ML backend
4. Python ML backend processes image and returns results
5. Java backend combines results and saves to database
6. Frontend displays results with visualizations
```

### 2. API Calls Between Backends

**Java → Python ML Backend:**
```java
// In your Java Spring Boot project, add this service:
@Service
public class MLInferenceService {
    @Value("${ml.backend.url:http://localhost:8001}")
    private String mlBackendUrl;
    
    public MLResult processImage(MultipartFile file) {
        // Call Python ML backend at localhost:8001
        RestTemplate restTemplate = new RestTemplate();
        // ... implementation
    }
}
```

**Python ML Backend Response:**
```json
{
  "anomaly_score": 0.856,
  "classification": "Faulty",
  "is_anomalous": true,
  "bounding_boxes": [
    {"x": 150, "y": 200, "width": 80, "height": 60, "type": "Critical"}
  ],
  "visualizations": {
    "mask_url": "/outputs/masks/image_123_mask.png",
    "overlay_url": "/outputs/overlays/image_123_overlay.png"
  }
}
```

## Setup Instructions

### Step 1: Start Python ML Backend
```bash
cd python-ml-backend
setup.bat  # or setup.sh on Linux
python main.py
# Runs on http://localhost:8001
```

### Step 2: Update Java Spring Boot Backend
Add these files to your Java project:
- `src/main/java/com/flarenet/service/MLInferenceService.java`
- `src/main/java/com/flarenet/controller/MLController.java`

### Step 3: Update React Frontend
Add the ML components to display results with bounding boxes.

## Files to Add to Your Java Spring Boot Project

### 1. MLInferenceService.java
```java
// Copy this to: flarenet-backend/src/main/java/com/flarenet/service/
// This service calls the Python ML backend
```

### 2. MLController.java  
```java
// Copy this to: flarenet-backend/src/main/java/com/flarenet/controller/
// This provides endpoints for the frontend
```

### 3. Update application.yml
```yaml
ml:
  backend:
    url: http://localhost:8001
```

## Testing the Integration

### 1. Test Python ML Backend Alone
```bash
cd python-ml-backend
python test_api.py
```

### 2. Test Full Integration
```bash
# Terminal 1: Start Python ML Backend
cd python-ml-backend
python main.py

# Terminal 2: Start Java Spring Boot
cd flarenet-backend
mvn spring-boot:run

# Terminal 3: Start React Frontend  
cd frontend
npm run dev

# Now upload an image through the React frontend
```

## API Endpoints

### Python ML Backend (Port 8001)
- `POST /api/v1/detect-anomaly` - Process single image
- `POST /api/v1/batch-detect` - Process multiple images
- `GET /api/v1/model-info` - Get model information
- `GET /health` - Health check

### Java Spring Boot (Port 8080)
- `POST /api/transformers/{id}/images` - Upload image (calls ML backend)
- `POST /api/ml/analyze-image` - Direct ML analysis
- `GET /api/ml/health` - Check ML backend status

## Visualization URLs

The Python ML backend generates visualization files that can be accessed via:
- `http://localhost:8001/outputs/masks/{filename}`
- `http://localhost:8001/outputs/overlays/{filename}`
- `http://localhost:8001/outputs/bounded/{filename}`

Your React frontend can display these images directly using the URLs returned in the JSON response.

## Error Handling

If Python ML backend is down:
- Java backend should handle gracefully
- Frontend should show appropriate error message
- System should continue working for non-ML features

## Next Steps

1. ✅ **Python ML Backend**: Ready (this project)
2. 🔄 **Java Integration**: Add service files to your Spring Boot project
3. 🔄 **Frontend Integration**: Add React components to display results
4. 🔄 **Testing**: Test the full integration flow

The Python ML backend is **completely separate** and **ready to use**. It just needs to be called by your Java backend!