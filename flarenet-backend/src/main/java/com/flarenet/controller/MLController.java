package com.flarenet.controller;

import com.flarenet.service.MLInferenceService;
import com.flarenet.service.MLInferenceService.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ml")
@CrossOrigin(origins = "http://localhost:5173")
public class MLController {

    private final MLInferenceService mlInferenceService;

    public MLController(MLInferenceService mlInferenceService) {
        this.mlInferenceService = mlInferenceService;
    }

    /**
     * Process thermal image with Python ML backend
     * This endpoint bridges between React frontend and Python ML backend
     */
    @PostMapping("/detect-anomaly")
    public ResponseEntity<EnhancedMLResult> detectAnomaly(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "transformerId", required = false) Long transformerId,
            @RequestParam(value = "return_visualizations", defaultValue = "true") boolean returnVisualizations,
            @RequestParam(value = "threshold", defaultValue = "0.5") double threshold) {

        try {
            // Call Python ML backend
            MLInferenceResult mlResult = mlInferenceService.processImage(file, returnVisualizations, threshold);
            
            // Enhance result with transformer context
            EnhancedMLResult enhancedResult = new EnhancedMLResult();
            enhancedResult.mlResult = mlResult;
            enhancedResult.transformerId = transformerId;
            enhancedResult.filename = file.getOriginalFilename();
            enhancedResult.fileSize = file.getSize();
            enhancedResult.contentType = file.getContentType();
            
            // Add risk assessment
            enhancedResult.riskLevel = determineRiskLevel(mlResult.anomalyScore);
            enhancedResult.recommendedAction = getRecommendedAction(mlResult.classification);
            enhancedResult.inspectionRequired = mlResult.isAnomalous;
            enhancedResult.priority = calculatePriority(mlResult.anomalyScore, mlResult.boundingBoxes);
            
            return ResponseEntity.ok(enhancedResult);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Check Python ML backend health status
     */
    @GetMapping("/health")
    public ResponseEntity<MLHealthStatus> checkMLHealth() {
        try {
            MLHealthStatus healthStatus = mlInferenceService.checkHealth();
            return ResponseEntity.ok(healthStatus);
        } catch (Exception e) {
            MLHealthStatus errorStatus = new MLHealthStatus("error", false, e.getMessage());
            return ResponseEntity.internalServerError().body(errorStatus);
        }
    }

    /**
     * Get visualization image URLs for frontend display
     */
    @GetMapping("/visualizations/{imageId}")
    public ResponseEntity<VisualizationUrls> getVisualizationUrls(@PathVariable String imageId) {
        try {
            VisualizationUrls urls = new VisualizationUrls();
            String baseUrl = "http://localhost:8001/outputs";
            
            urls.maskUrl = baseUrl + "/masks/" + imageId + "_mask.png";
            urls.overlayUrl = baseUrl + "/overlays/" + imageId + "_overlay.png";
            urls.filteredUrl = baseUrl + "/filtered/" + imageId + "_filtered.png";
            urls.boundedUrl = baseUrl + "/bounded/" + imageId + "_bounded.png";
            
            return ResponseEntity.ok(urls);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Helper methods for risk assessment
    private String determineRiskLevel(double anomalyScore) {
        if (anomalyScore >= 0.8) return "CRITICAL";
        if (anomalyScore >= 0.5) return "HIGH";
        if (anomalyScore >= 0.3) return "MEDIUM";
        return "LOW";
    }

    private String getRecommendedAction(String classification) {
        switch (classification.toUpperCase()) {
            case "FAULTY":
                return "IMMEDIATE_INSPECTION_REQUIRED";
            case "OVERLOWAY":
                return "SCHEDULE_MAINTENANCE";
            case "POTENTIAL":
                return "MONITOR_CLOSELY";
            case "NORMAL":
            default:
                return "CONTINUE_NORMAL_OPERATION";
        }
    }

    private String calculatePriority(double anomalyScore, java.util.List<BoundingBox> boundingBoxes) {
        int boxCount = boundingBoxes != null ? boundingBoxes.size() : 0;
        
        if (anomalyScore >= 0.8 || boxCount >= 3) return "URGENT";
        if (anomalyScore >= 0.5 || boxCount >= 2) return "HIGH";
        if (anomalyScore >= 0.3 || boxCount >= 1) return "MEDIUM";
        return "LOW";
    }

    // Enhanced result DTO for frontend
    public static class EnhancedMLResult {
        public MLInferenceResult mlResult;
        public Long transformerId;
        public String filename;
        public Long fileSize;
        public String contentType;
        public String riskLevel;
        public String recommendedAction;
        public boolean inspectionRequired;
        public String priority;
    }

    // Visualization URLs DTO
    public static class VisualizationUrls {
        public String maskUrl;
        public String overlayUrl;
        public String filteredUrl;
        public String boundedUrl;
    }
}