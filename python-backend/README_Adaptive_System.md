# FlareNet Adaptive Feedback System

## Overview

The FlareNet Adaptive Feedback System implements reinforcement learning for thermal image anomaly detection by adapting OpenCV classification parameters based on user feedback. This system improves detection accuracy without retraining the core PatchCore model.

## System Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Frontend (React)  │    │  Java Backend       │    │  Python ML Backend │
│   - User Interface  │◄──►│  - API Gateway      │◄──►│  - Anomaly Detection│
│   - Feedback Tools  │    │  - File Management  │    │  - Adaptive Learning│
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────────┐
                                              │  Feedback System    │
                                              │  - Parameter Adapt. │
                                              │  - Learning Logic   │
                                              └─────────────────────┘
```

## Key Components

### 1. **adaptive_params.py**
- Manages adaptive parameters for OpenCV classification
- Handles parameter persistence and loading
- Implements adaptation logic based on feedback types

### 2. **feedback_handler.py** 
- Processes user feedback and analyzes changes
- Stores feedback history for analysis
- Triggers parameter adaptations

### 3. **model_core.py** (Modified)
- Enhanced `classify_anomalies_adaptive()` function
- Uses adaptive parameters instead of hardcoded values
- Provides API endpoints for feedback processing

### 4. **adaptive_api.py**
- Flask API wrapper for Java backend integration
- HTTP endpoints for feedback processing
- Parameter monitoring and export capabilities

## Adaptive Parameters

The system adapts these OpenCV classification parameters:

### Detection Sensitivity
- **percent_threshold**: Controls overall detection sensitivity (0-100)
- **min_area_factor**: Minimum detection area as fraction of image

### HSV Color Thresholds
- **hue_low/hue_high**: Thermal hotspot hue ranges
- **saturation_min**: Minimum saturation for thermal detection
- **value_min**: Minimum brightness for thermal detection

### Color Classification
- **red_hue_min/max**: Red color ranges for severity assessment
- **orange_hue_min/max**: Orange color ranges
- **yellow_hue_min/max**: Yellow color ranges
- **color_sat_min/val_min**: Saturation and value thresholds

### Geometric Rules
- **loose_joint_area_min**: Minimum area fraction for loose joint classification
- **loose_joint_overlap_min**: Minimum center overlap for loose joints
- **wire_aspect_ratio**: Aspect ratio threshold for wire classification
- **wire_overload_area**: Area threshold for full wire overload

### Severity Classification
- **faulty_red_orange_threshold**: Red/orange fraction threshold for "Faulty" severity

### Confidence Factors
- **loose_joint_base**: Base confidence for loose joint detections
- **wire_base**: Base confidence for wire-related detections
- **point_base**: Base confidence for point overload detections

## Feedback Types and Adaptations

### 1. **False Positive (User Deletes Detection)**
- **Effect**: Reduces sensitivity
- **Changes**: 
  - Increases `percent_threshold` (+3)
  - Increases `min_area_factor` (×1.2)
  - Increases `saturation_min` (+0.02)

### 2. **False Negative (User Adds Detection)**
- **Effect**: Increases sensitivity  
- **Changes**:
  - Decreases `percent_threshold` (-3)
  - Decreases `min_area_factor` (×0.8)
  - Decreases `saturation_min` (-0.02)

### 3. **Bounding Box Resize**
- **Smaller Box**: Tightens geometric rules (increases area thresholds)
- **Larger Box**: Relaxes geometric rules (decreases area thresholds)
- **Moved Box**: Logs position feedback for future analysis

### 4. **Severity Change**
- **Faulty → Potentially Faulty**: Increases `faulty_red_orange_threshold` (+0.05)
- **Potentially Faulty → Faulty**: Decreases `faulty_red_orange_threshold` (-0.05)

### 5. **Category Change**
- Logs category corrections for future rule adaptations
- Can be extended to adapt geometric classification rules

## Usage

### Running the Test System

```bash
cd python-backend
python test_adaptive_system.py
```

This will demonstrate the adaptive feedback system with sample scenarios.

### Starting the API Server

```bash
cd python-backend
python adaptive_api.py
```

The API will be available at `http://localhost:5001`

### API Endpoints

#### Process User Feedback
```http
POST /api/feedback
Content-Type: application/json

{
  "image_id": "thermal_001",
  "user_id": "engineer_123",
  "original_detections": [
    {
      "id": "det_1",
      "category": "loose_joint",
      "severity": "Faulty",
      "confidence": 0.85,
      "bbox": {"x": 100, "y": 150, "width": 80, "height": 60}
    }
  ],
  "user_corrections": [
    {
      "id": "det_1", 
      "category": "loose_joint",
      "severity": "Potentially Faulty",
      "confidence": 0.85,
      "bbox": {"x": 105, "y": 155, "width": 70, "height": 50}
    }
  ]
}
```

#### Get Current Parameters
```http
GET /api/parameters
```

#### Get Feedback Statistics
```http
GET /api/feedback/statistics
```

#### Export Feedback Log
```http
GET /api/feedback/export?format=json
GET /api/feedback/export?format=csv
```

#### Reset Parameters
```http
POST /api/parameters/reset
```

## Integration with Java Backend

The Java backend can integrate with this system by:

1. **Sending feedback data** via POST to `/api/feedback`
2. **Monitoring parameters** via GET to `/api/parameters`
3. **Exporting feedback logs** for analysis
4. **Health monitoring** via `/api/health`

Example Java integration:
```java
// Send user feedback
String feedbackJson = buildFeedbackJson(imageId, userId, originalDetections, userCorrections);
HttpResponse response = httpClient.post("http://localhost:5001/api/feedback", feedbackJson);

// Get current parameters
HttpResponse paramsResponse = httpClient.get("http://localhost:5001/api/parameters");
```

## File Structure

```
python-backend/
├── model_core.py              # Enhanced with adaptive classification
├── adaptive_params.py         # Parameter management and adaptation
├── feedback_handler.py        # Feedback processing and analysis
├── adaptive_api.py           # Flask API wrapper
├── test_adaptive_system.py   # Test and demonstration script
├── feedback_data/            # Data storage directory
│   ├── adaptive_parameters.json
│   └── user_corrections.json
├── model_weights/            # PatchCore model (unchanged)
│   └── patchcore_model.pkl
├── test_image/              # Input images
├── output_image/            # Processed output images
├── labeled_segmented/       # Segmented images with labels
└── annotations_json/        # JSON annotations
```

## Benefits

1. **No Model Retraining**: Adapts OpenCV parameters without touching the PatchCore model
2. **Real-time Learning**: Immediate adaptation based on user feedback
3. **Persistent Learning**: Parameters are saved and persist across sessions
4. **Comprehensive Feedback**: Handles deletions, additions, resizes, and severity changes
5. **API Integration**: Easy integration with existing Java backend
6. **Monitoring**: Built-in statistics and logging for analysis

## Future Enhancements

1. **Advanced Learning**: Implement more sophisticated adaptation algorithms
2. **User-specific Learning**: Adapt parameters based on individual user patterns
3. **Confidence Learning**: Adapt confidence calculation based on user feedback
4. **Batch Learning**: Process multiple feedback items for batch parameter updates
5. **A/B Testing**: Compare different parameter sets for optimal performance

## Notes

- The PatchCore model remains unchanged and is used only for anomaly segmentation
- All learning happens in the OpenCV classification layer
- Parameters are automatically saved to `feedback_data/adaptive_parameters.json`
- Feedback history is stored in `feedback_data/user_corrections.json`
- The system is designed to be lightweight and fast for real-time usage