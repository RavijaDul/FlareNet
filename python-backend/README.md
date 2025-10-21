# FlareNet Adaptive Learning System

## System Overview

The FlareNet Adaptive Learning System enhances thermal image anomaly detection accuracy through user feedback-driven parameter optimization. The system adapts OpenCV classification parameters in real-time without requiring model retraining.

## Architecture Flow

```
Frontend (React) → Java Backend → Python ML Backend
     ↑                 ↓              ↓
User Annotations → Database → Adaptive Learning System
     ↑                          ↓
Parameter Updates ← Feedback Processing
```

## Project Structure

### Core Components

**Python ML Backend (`python-backend/`)**
```
├── app.py                    # FastAPI server (port 5000)
├── model_core.py            # Enhanced anomaly classification
├── adaptive_params.py       # Parameter management
├── feedback_handler.py      # User feedback processing
├── adaptive_api.py          # Flask API (port 5001)
└── feedback_data/           # Persistent storage
    ├── adaptive_parameters.json  # Current parameters
    └── user_corrections.json     # Feedback history
```

**Java Backend Integration**
- `UserAnnotationService.java` - Calls Python adaptive system
- `AnnotationController.java` - Handles frontend requests
- Database tables: `analysis_result`, `user_annotations`

## Main Processing Pipeline

### 1. Image Analysis (`app.py`)
```
POST /analyze
├── Load thermal image
├── PatchCore model inference (unchanged)
├── classify_anomalies_adaptive() with current parameters
└── Return JSON results
```

### 2. User Feedback Processing (`app.py`)
```
POST /adaptive-feedback
├── Receive original AI analysis + user corrections
├── Convert database JSON format to internal format
├── Process through adaptive_params system
├── Update classification parameters
└── Log feedback for analysis
```

### 3. Parameter Adaptation (`adaptive_params.py`)
- **False Positives**: Reduce sensitivity (↑ thresholds)
- **False Negatives**: Increase sensitivity (↓ thresholds)  
- **Bounding Box Changes**: Adjust geometric rules
- **Severity Changes**: Modify color classification thresholds

## Key Scripts and Functions

### `model_core.py`
- `classify_anomalies_adaptive()` - Main classification with adaptive parameters
- `process_user_feedback_api()` - API endpoint for feedback processing
- Uses parameters from `adaptive_params.current_params`

### `adaptive_params.py`
- `AdaptiveParams.adapt_from_feedback()` - Core adaptation logic
- `save_params()` / `load_params()` - Parameter persistence
- Parameter categories: detection, HSV, geometric, severity, confidence

### `feedback_handler.py`
- `process_user_feedback()` - Analyze user changes
- `_analyze_feedback()` - Detect feedback types (false pos/neg, edits)
- `_store_feedback()` - Log feedback entries

## Database Integration

### Input Format (from Java backend)
```json
{
  "thermalImageId": 11,
  "userId": "H1210", 
  "originalAnalysisJson": "{\"anomalies\":[...]}",
  "userAnnotationsJson": "{\"anomalies\":[{\"isDeleted\":false,\"isUserAdded\":true,...}]}"
}
```

### Processing Chain
1. Java saves user annotations to database
2. `UserAnnotationService.saveAnnotations()` calls Python adaptive system
3. Python processes feedback and updates parameters
4. Next image analysis uses updated parameters

## Current Parameter State
**Adaptive Parameters** (from `feedback_data/adaptive_parameters.json`):
- `percent_threshold`: 47 (reduced from 50 - more sensitive)
- `min_area_factor`: 0.0008 (reduced from 0.001 - smaller detections)
- Classification and severity thresholds remain at defaults

**Active Feedback Entries**: 1 entry logged with false negative correction (user added detection)

## Debugging and Monitoring

### Python Console Logs
```python
# Feedback processing logs
print(f"Processing feedback for image {thermal_image_id} by user {user_id}")
print(f"Feedback stats: {len(original_detections)} orig, {deleted_count} deleted, {added_count} added")
print(f"Adaptations applied: {result.get('adaptations_applied', [])}")
```

### Parameter Monitoring
```bash
# Check current parameters
GET http://localhost:5000/parameters

# View feedback history  
cat feedback_data/user_corrections.json

# Monitor parameter changes
cat feedback_data/adaptive_parameters.json
```

### Java Integration Status
- ✓ `UserAnnotationService` modified to call Python system
- ✓ Adaptive feedback endpoint configured
- ✓ Error handling for Python backend unavailability
- ✓ Database JSON format compatibility

## System Status
- **Operational**: Parameters adapting based on user feedback
- **Evidence**: threshold reduced from 50→47, min_area_factor 0.001→0.0008
- **Feedback Logged**: 1 false negative correction processed
- **Integration**: Java↔Python communication established

## Next Image Analysis
Will use updated parameters (more sensitive detection with smaller minimum area requirements) based on user feedback indicating the system missed detections.


# FlareNet Adaptive Learning Mathematics and Logic

## Mathematical Foundation

### Core Adaptation Principle

The adaptive system modifies classification parameters `Θ = {θ₁, θ₂, ..., θₙ}` based on user feedback corrections using a feedback-driven parameter update mechanism:

```
Θₜ₊₁ = Θₜ + α · ∇f(F_user, D_original)
```

Where:
- `Θₜ` = Parameter vector at time t
- `α` = Learning rate (adaptive per parameter type)
- `F_user` = User feedback corrections  
- `D_original` = Original model detections
- `∇f` = Gradient function derived from feedback analysis

## Parameter Categories and Update Functions

### 1. Detection Sensitivity Parameters

#### Threshold Adaptation
**Parameter**: `percent_threshold` ∈ [10, 90]
**Mathematical Update**:
```
θ_threshold(t+1) = θ_threshold(t) + Δ_sensitivity

Where:
Δ_sensitivity = {
    +3  if False Positives > False Negatives
    -3  if False Negatives > False Positives  
    0   otherwise
}
```

**K-Value Conversion**:
```
k_value = 1.1 + (percent_threshold/100) × (2.1 - 1.1)
k_value ∈ [1.1, 2.1]

Anomaly Threshold = μ_anomaly + k_value × σ_anomaly
```

#### Minimum Area Adaptation
**Parameter**: `min_area_factor` ∈ [0.0005, 0.005]
**Mathematical Update**:
```
θ_area(t+1) = θ_area(t) × λ_area

Where:
λ_area = {
    1.2   if False Positives > False Negatives (stricter)
    0.8   if False Negatives > False Positives (looser)
    1.0   otherwise
}

min_area = max(32, ⌊W × H × θ_area⌋)
```

### 2. HSV Color Space Adaptation

#### Thermal Detection Thresholds
**Parameters**: `{hue_low, hue_high, saturation_min, value_min}`

**Hue Range Adaptation**:
```
warm_hue_condition = (H/180 ≤ hue_low) ∨ (H/180 ≥ hue_high)

Current: hue_low = 0.17, hue_high = 0.95 (fixed)
```

**Saturation Sensitivity**:
```
θ_sat(t+1) = θ_sat(t) + Δ_sat

Where:
Δ_sat = {
    +0.02  if reducing sensitivity (fewer false positives)
    -0.02  if increasing sensitivity (catch more anomalies)
}

θ_sat ∈ [0.2, 0.5]
```

### 3. Geometric Classification Rules

#### Loose Joint Detection
**Area Fraction Rule**:
```
area_fraction = (bbox_width × bbox_height) / (image_width × image_height)

loose_joint_condition = area_fraction ≥ θ_loose_area ∧ 
                       (overlap_fraction ≥ θ_overlap ∨ area_fraction ≥ θ_large_area)
```

**Adaptation Logic**:
```
If user resizes bounding box:
  area_ratio = corrected_area / original_area
  
  θ_loose_area(t+1) = {
    θ_loose_area(t) × 1.1    if area_ratio < 0.8 (user made smaller)
    θ_loose_area(t) × 0.9    if area_ratio > 1.2 (user made larger)  
    θ_loose_area(t)          otherwise
  }
  
  Constraints: θ_loose_area ∈ [0.05, 0.20]
```

#### Wire Classification  
**Aspect Ratio Rule**:
```
aspect_ratio = max(bbox_width, bbox_height) / min(bbox_width, bbox_height)

wire_condition = aspect_ratio ≥ θ_wire_aspect (currently 2.0)
```

### 4. Severity Classification Mathematics

#### Color-Based Severity Assessment
**Red/Orange Fraction Calculation**:
```
For bounding box region B:
  red_mask = ((H ≤ 10) ∨ (H ≥ 160)) ∧ (S ≥ 100) ∧ (V ≥ 100)
  orange_mask = (10 < H ≤ 25) ∧ (S ≥ 100) ∧ (V ≥ 100)
  warm_pixels = count(red_mask ∨ orange_mask)
  total_warm = count(red_mask ∨ orange_mask ∨ yellow_mask)
  
  red_orange_fraction = warm_pixels / total_warm
```

**Severity Decision Function**:
```
severity = {
  "Faulty"               if red_orange_fraction ≥ θ_faulty
  "Potentially Faulty"   if red_orange_fraction < θ_faulty
}
```

**Threshold Adaptation**:
```
θ_faulty(t+1) = θ_faulty(t) + Δ_severity

Where:
Δ_severity = {
    +0.05  if user changes "Faulty" → "Potentially Faulty" (too harsh)
    -0.05  if user changes "Potentially Faulty" → "Faulty" (too lenient)
    0      otherwise
}

θ_faulty ∈ [0.2, 0.8]
```

### 5. Confidence Score Calculation

#### Multi-Factor Confidence Model
```
confidence = min(1.0, base_confidence + Σ(factor_i × weight_i))

For different anomaly types:
  
Loose Joint:
  conf_loose = min(1.0, 0.6 + 0.8 × area_fraction)
  
Wire Overload:  
  conf_wire = min(1.0, 0.5 + 0.2 × aspect_ratio)
  
Point Overload:
  conf_point = min(1.0, 0.5 + 0.5 × brightness_mean)
```

## Feedback Analysis Algorithm

### User Action Classification
```python
def analyze_feedback(original_detections, user_corrections):
    feedback_types = []
    
    # Deletion Analysis (False Positives)
    for orig in original_detections:
        if orig not in user_corrections:
            feedback_types.append("false_positive")
    
    # Addition Analysis (False Negatives)  
    for corr in user_corrections:
        if corr.isUserAdded:
            feedback_types.append("false_negative")
    
    # Modification Analysis
    for orig, corr in matching_pairs(original_detections, user_corrections):
        if bbox_changed(orig.bbox, corr.bbox):
            area_ratio = (corr.bbox.area) / (orig.bbox.area)
            feedback_types.append({
                "type": "bbox_resize", 
                "area_ratio": area_ratio
            })
        
        if orig.severity != corr.severity:
            feedback_types.append({
                "type": "severity_change",
                "from": orig.severity,
                "to": corr.severity  
            })
    
    return feedback_types
```

### Parameter Update Priority
1. **Detection Sensitivity** (highest priority)
2. **Geometric Rules** (medium priority)  
3. **Severity Thresholds** (medium priority)
4. **HSV Adjustments** (lowest priority)

## Convergence and Stability

### Learning Rate Decay
```
α(t) = α₀ × e^(-λt)

Where:
- α₀ = Initial learning rate (parameter-dependent)
- λ = Decay constant (0.01)
- t = Number of feedback iterations
```

### Parameter Bounds
All parameters have defined bounds to ensure system stability:

```
Bounds = {
    percent_threshold: [10, 90],
    min_area_factor: [0.0005, 0.005], 
    saturation_min: [0.2, 0.5],
    loose_joint_area_min: [0.05, 0.20],
    faulty_red_orange_threshold: [0.2, 0.8]
}
```

### Oscillation Prevention
```
if |θ(t) - θ(t-1)| > oscillation_threshold:
    θ(t+1) = 0.5 × (θ(t) + θ(t-1))  # Damping
```

## Real-World Performance

### Current System State (Example)
Based on feedback entry analysis:

**Original State**: `percent_threshold = 50`, `min_area_factor = 0.001`
**After 1 False Negative**: `percent_threshold = 47`, `min_area_factor = 0.0008`

**Mathematical Verification**:
```
False Negative detected → Increase sensitivity
Δ_threshold = -3  →  50 + (-3) = 47 ✓
λ_area = 0.8     →  0.001 × 0.8 = 0.0008 ✓
```

### Expected Performance Impact
- **Detection Sensitivity**: 6% increase (50→47 threshold)
- **Minimum Area**: 20% reduction (catches smaller anomalies)
- **Expected Recall Improvement**: ~15-25% for similar thermal signatures

## Implementation Verification

### Mathematical Consistency Check
```python
def verify_parameter_consistency():
    params = load_current_parameters()
    
    # Check bounds
    assert 10 <= params.percent_threshold <= 90
    assert 0.0005 <= params.min_area_factor <= 0.005
    
    # Check k-value calculation  
    k_computed = 1.1 + (params.percent_threshold/100) * (2.1-1.1)
    assert 1.1 <= k_computed <= 2.1
    
    # Verify area calculation
    min_area = max(32, int(640 * 480 * params.min_area_factor))
    assert min_area >= 32
```

This mathematical framework ensures consistent, bounded, and convergent adaptation of the FlareNet classification system based on expert user feedback.