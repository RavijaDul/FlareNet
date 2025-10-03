package com.flarenet.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Service
public class MLInferenceService {

    @Value("${ml.backend.url:http://localhost:8001}")
    private String mlBackendUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public MLInferenceService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Process single image for anomaly detection with Python ML backend
     */
    public MLInferenceResult processImage(MultipartFile imageFile, boolean returnVisualizations, double threshold) {
        try {
            // Prepare multipart request for Python backend
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            
            ByteArrayResource fileResource = new ByteArrayResource(imageFile.getBytes()) {
                @Override
                public String getFilename() {
                    return imageFile.getOriginalFilename();
                }
            };
            
            body.add("file", fileResource);
            body.add("return_visualizations", returnVisualizations);
            body.add("threshold", threshold);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = 
                new HttpEntity<>(body, headers);

            // Call Python ML backend at localhost:8001
            ResponseEntity<String> response = restTemplate.postForEntity(
                mlBackendUrl + "/api/v1/detect-anomaly",
                requestEntity,
                String.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                return objectMapper.readValue(response.getBody(), MLInferenceResult.class);
            } else {
                throw new RuntimeException("ML backend returned error: " + response.getStatusCode());
            }

        } catch (Exception e) {
            throw new RuntimeException("Failed to process image with Python ML backend: " + e.getMessage(), e);
        }
    }

    /**
     * Check if Python ML backend is healthy
     */
    public MLHealthStatus checkHealth() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                mlBackendUrl + "/health",
                String.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                return objectMapper.readValue(response.getBody(), MLHealthStatus.class);
            } else {
                return new MLHealthStatus("unhealthy", false, "HTTP " + response.getStatusCode().value());
            }

        } catch (Exception e) {
            return new MLHealthStatus("unreachable", false, "Cannot connect to Python ML backend: " + e.getMessage());
        }
    }

    // DTO Classes for Python ML backend responses
    public static class MLInferenceResult {
        @JsonProperty("anomaly_score")
        public double anomalyScore;
        
        @JsonProperty("classification")
        public String classification;
        
        @JsonProperty("confidence")
        public String confidence;
        
        @JsonProperty("is_anomalous")
        public boolean isAnomalous;
        
        @JsonProperty("bounding_boxes")
        public List<BoundingBox> boundingBoxes;
        
        @JsonProperty("visualizations")
        public Map<String, String> visualizations;
        
        @JsonProperty("processing_time")
        public double processingTime;
        
        @JsonProperty("model_version")
        public String modelVersion;
        
        @JsonProperty("original_filename")
        public String originalFilename;
        
        @JsonProperty("image_id")
        public String imageId;
    }

    public static class BoundingBox {
        public int x;
        public int y;
        public int width;
        public int height;
        public double confidence;
        public String type;
        public int area;
    }

    public static class MLHealthStatus {
        public String status;
        
        @JsonProperty("model_loaded")
        public boolean modelLoaded;
        
        public String message;

        public MLHealthStatus() {}

        public MLHealthStatus(String status, boolean modelLoaded, String message) {
            this.status = status;
            this.modelLoaded = modelLoaded;
            this.message = message;
        }
    }
}