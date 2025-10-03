# 🚀 Quick Start Guide - Separate Backends

## Architecture
```
React Frontend     Java Spring Boot     Python ML Backend
(Port 5173)   ←→   (Port 8080)     ←→   (Port 8001)
     ↓                  ↓                    ↓
Display Results    Store in DB       Process with AI
Show Bounding     API Bridge        PatchCore Model
     Boxes        Database          Visualizations
```

## Step-by-Step Setup

### 1. Start Python ML Backend (THIS FOLDER)
```bash
cd python-ml-backend
setup.bat  # Windows
# OR
chmod +x setup.sh && ./setup.sh  # Linux/WSL

# Start the ML server
python main.py
# ✅ Running on http://localhost:8001
```

### 2. Update Java Spring Boot Backend
```bash
cd ../flarenet-backend

# Files already added:
# ✅ src/main/java/com/flarenet/service/MLInferenceService.java
# ✅ src/main/java/com/flarenet/controller/MLController.java
# ✅ src/main/resources/application.yml (updated)

# Start Java backend
mvn spring-boot:run
# ✅ Running on http://localhost:8080
```

### 3. Update React Frontend
```bash
cd ../frontend

# File already added:
# ✅ src/components/MLAnalysis.jsx

# Add to your existing components:
import { EnhancedImageUpload } from './components/MLAnalysis';

# Start frontend
npm run dev
# ✅ Running on http://localhost:5173
```

## Usage in Your React Components

### Example Integration
```jsx
import React from 'react';
import { EnhancedImageUpload } from './components/MLAnalysis';

function TransformerInspection({ transformerId }) {
  const handleAnalysisComplete = (result) => {
    console.log('ML Analysis Result:', result);
    // result.mlResult.anomalyScore
    // result.mlResult.classification  
    // result.mlResult.boundingBoxes
    // result.riskLevel
    // result.recommendedAction
  };

  return (
    <div>
      <h2>Transformer {transformerId} Inspection</h2>
      <EnhancedImageUpload 
        transformerId={transformerId}
        onAnalysisComplete={handleAnalysisComplete}
      />
    </div>
  );
}
```

## API Flow

### 1. User uploads image in React
```javascript
// React calls Java backend
POST http://localhost:8080/api/ml/detect-anomaly
```

### 2. Java backend forwards to Python ML backend
```java
// Java calls Python ML backend  
POST http://localhost:8001/api/v1/detect-anomaly
```

### 3. Python ML backend processes with PatchCore
```python
# Python processes image and returns:
{
  "anomaly_score": 0.856,
  "classification": "Faulty",
  "bounding_boxes": [...],
  "visualizations": {...}
}
```

### 4. Java backend enhances and returns to React
```java
// Java adds risk assessment and returns:
{
  "mlResult": {...},
  "riskLevel": "CRITICAL", 
  "recommendedAction": "IMMEDIATE_INSPECTION_REQUIRED",
  "priority": "URGENT"
}
```

### 5. React displays results with bounding boxes
```jsx
// React shows:
// - Anomaly score
// - Classification with colors
// - Bounding boxes on image  
// - Risk level
// - Recommended actions
// - Visualization links
```

## Test the Integration

### 1. Test Python ML Backend Alone
```bash
cd python-ml-backend
python test_api.py
```

### 2. Test Full Integration
```bash
# Terminal 1: Python ML Backend
cd python-ml-backend
python main.py

# Terminal 2: Java Spring Boot  
cd flarenet-backend
mvn spring-boot:run

# Terminal 3: React Frontend
cd frontend  
npm run dev

# Open browser: http://localhost:5173
# Upload a thermal image and see ML results!
```

## What You Get

### ML Analysis Results:
- ✅ **Anomaly Score**: 0.0-1.0 (0.856 = 85.6% anomalous)
- ✅ **Classification**: Normal → Potential → Overloway → Faulty  
- ✅ **Bounding Boxes**: Rectangles around anomalous regions
- ✅ **Risk Level**: LOW → MEDIUM → HIGH → CRITICAL
- ✅ **Recommended Action**: What to do next
- ✅ **Visualizations**: Mask, overlay, filtered, bounded images

### File Outputs (from Python backend):
- `http://localhost:8001/outputs/masks/image_123_mask.png`
- `http://localhost:8001/outputs/overlays/image_123_overlay.png`  
- `http://localhost:8001/outputs/bounded/image_123_bounded.png`

## System Status Check

### Health Endpoints:
- **Python ML Backend**: `GET http://localhost:8001/health`
- **Java Backend ML Status**: `GET http://localhost:8080/api/ml/health`

### Expected Response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "message": "PatchCore model ready"
}
```

---

## 🎯 You're Ready!

1. ✅ **Python ML Backend**: Completely separate, runs on port 8001
2. ✅ **Java Integration**: Service & controller added to your existing backend  
3. ✅ **React Components**: Ready-to-use components for ML results
4. ✅ **Bounding Boxes**: Automatic detection and classification
5. ✅ **Visualizations**: Multiple image outputs for frontend display

**All backends are separate and communicate via REST APIs!** 🚀