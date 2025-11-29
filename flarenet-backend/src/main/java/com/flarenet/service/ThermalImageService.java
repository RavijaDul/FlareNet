package com.flarenet.service;

import com.flarenet.entity.*;
import com.flarenet.entity.enums.ImageType;
import com.flarenet.entity.enums.WeatherCondition;
import com.flarenet.repository.*;
import com.flarenet.service.storage.StorageService;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.FileSystemResource;
import org.springframework.util.LinkedMultiValueMap;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.file.Path;
import java.util.*;

@Service
public class ThermalImageService {

    private final ThermalImageRepository images;
    private final TransformerRepository transformers;
    private final InspectionRepository inspections;
    private final StorageService storage;
    private final AnalysisResultRepository analysisRepo;
    private final DetectionRepository detectionRepo;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public ThermalImageService(
            ThermalImageRepository images,
            TransformerRepository transformers,
            InspectionRepository inspections,
            StorageService storage,
            AnalysisResultRepository analysisRepo,
            DetectionRepository detectionRepo,
            RestTemplate restTemplate,
            ObjectMapper objectMapper
    ) {
        this.images = images;
        this.transformers = transformers;
        this.inspections = inspections;
        this.storage = storage;
        this.analysisRepo = analysisRepo;
        this.detectionRepo = detectionRepo;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public ThermalImage upload(Long transformerId, MultipartFile file, ImageType type,
                               WeatherCondition weather, String uploader, Long inspectionId) {

        Transformer t = transformers.findById(transformerId)
                .orElseThrow(() -> new IllegalArgumentException("Transformer not found"));

        if (type == ImageType.BASELINE) {
            Optional<ThermalImage> existingBaseline = images.findByTransformerAndImageType(t, ImageType.BASELINE)
                    .stream().findFirst();
            if (existingBaseline.isPresent()) {
                return existingBaseline.get();
            }
            if (weather == null) {
                throw new IllegalArgumentException("Baseline image requires weather condition");
            }
        }

        Path stored = storage.store(transformerId, file);
        ThermalImage img = new ThermalImage();
        img.setTransformer(t);
        img.setImageType(type);
        img.setWeatherCondition(weather);
        img.setUploader(uploader);
        img.setFileName(file.getOriginalFilename());
        img.setContentType(file.getContentType() == null
                ? MediaType.APPLICATION_OCTET_STREAM_VALUE
                : file.getContentType());
        img.setSizeBytes(file.getSize());
        img.setFilePath(stored.toString());

        if (inspectionId != null) {
            Inspection inspection = inspections.findById(inspectionId)
                    .orElseThrow(() -> new IllegalArgumentException("Inspection not found"));
            img.setInspection(inspection);
        }

        ThermalImage saved = images.save(img);

        // --- NEW: If maintenance image, send to Python backend ---
        if (type == ImageType.MAINTENANCE) {
            try {
                String pythonUrl = "http://localhost:5000/analyze";
                FileSystemResource fileResource = new FileSystemResource(saved.getFilePath());

                LinkedMultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                body.add("file", fileResource);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);

                HttpEntity<LinkedMultiValueMap<String, Object>> requestEntity =
                        new HttpEntity<>(body, headers);

                ResponseEntity<String> response =
                        restTemplate.postForEntity(pythonUrl, requestEntity, String.class);

                if (response.getStatusCode().is2xxSuccessful()) {
                    String jsonResponse = response.getBody();
                    
                    // Create and save analysis result
                    AnalysisResult result = new AnalysisResult();
                    result.setImage(saved);
                    result.setResultJson(jsonResponse);
                    
                    // Parse and populate normalized fields
                    try {
                        populateAnalysisResultFromJson(result, jsonResponse);
                    } catch (Exception parseEx) {
                        System.err.println("⚠️ Error parsing analysis JSON: " + parseEx.getMessage());
                        result.setStatus("Unknown");
                        result.setTotalDetections(0);
                    }
                    
                    // Save analysis result first to get ID
                    result = analysisRepo.save(result);
                    
                    // Populate detection table with individual detections
                    try {
                        populateDetections(result, jsonResponse);
                    } catch (Exception detEx) {
                        System.err.println("⚠️ Error populating detections: " + detEx.getMessage());
                    }
                    
                    System.out.println("✅ Analysis saved with " + result.getTotalDetections() + " detections");
                } else {
                    System.err.println("⚠️ Python backend returned: " + response.getStatusCode());
                }

            } catch (Exception e) {
                System.err.println("⚠️ Error calling Python backend: " + e.getMessage());
            }
        }

        return saved;
    }

    public List<ThermalImage> list(Long transformerId) {
        return images.findByTransformerId(transformerId);
    }

    public Optional<ThermalImage> getBaselineImageForTransformer(Long transformerId) {
        Transformer t = transformers.findById(transformerId)
                .orElseThrow(() -> new IllegalArgumentException("Transformer not found"));
        return images.findByTransformerAndImageType(t, ImageType.BASELINE).stream().findFirst();
    }

    public List<ThermalImage> getMaintenanceImagesForInspection(Long inspectionId) {
        Inspection inspection = inspections.findById(inspectionId)
                .orElseThrow(() -> new IllegalArgumentException("Inspection not found"));
        return images.findByInspectionAndImageType(inspection, ImageType.MAINTENANCE);
    }

    public ThermalImage getImageById(Long imageId) {
        return images.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("Image not found"));
    }

    public void deleteBaselineImage(Long transformerId) {
        Transformer t = transformers.findById(transformerId)
                .orElseThrow(() -> new IllegalArgumentException("Transformer not found"));

        ThermalImage baselineImage = images.findByTransformerAndImageType(t, ImageType.BASELINE)
                .stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No baseline image found"));

        storage.delete(baselineImage.getFilePath());
        images.delete(baselineImage);
    }

    public void deleteImageById(Long imageId) {
        ThermalImage image = images.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("Image not found"));

        // Delete file from storage
        storage.delete(image.getFilePath());

        // Remove DB entry
        images.delete(image);
    }

    public Optional<AnalysisResult> getAnalysisForImage(Long imageId) {
        return Optional.ofNullable(analysisRepo.findByImageId(imageId));
    }

    /**
     * Parse JSON and populate analysis_result summary fields
     */
    private void populateAnalysisResultFromJson(AnalysisResult result, String jsonResponse) throws Exception {
        JsonNode root = objectMapper.readTree(jsonResponse);
        
        // Set status
        String status = root.has("status") ? root.get("status").asText() : "Normal";
        result.setStatus(status);
        
        // Count detections by severity
        JsonNode anomalies = root.get("anomalies");
        if (anomalies != null && anomalies.isArray()) {
            int totalCount = anomalies.size();
            int criticalCount = 0;
            int potentiallyFaultyCount = 0;
            
            for (JsonNode anomaly : anomalies) {
                String severity = anomaly.has("severity") ? anomaly.get("severity").asText() : "";
                if (severity.equalsIgnoreCase("Critical")) {
                    criticalCount++;
                } else if (severity.equalsIgnoreCase("Potentially Faulty")) {
                    potentiallyFaultyCount++;
                }
            }
            
            result.setTotalDetections(totalCount);
            result.setCriticalCount(criticalCount);
            result.setPotentiallyFaultyCount(potentiallyFaultyCount);
        } else {
            result.setTotalDetections(0);
            result.setCriticalCount(0);
            result.setPotentiallyFaultyCount(0);
        }
    }

    /**
     * Parse JSON and populate individual detection records
     */
    private void populateDetections(AnalysisResult analysisResult, String jsonResponse) throws Exception {
        JsonNode root = objectMapper.readTree(jsonResponse);
        JsonNode anomalies = root.get("anomalies");
        
        if (anomalies == null || !anomalies.isArray()) {
            return;
        }
        
        for (JsonNode anomaly : anomalies) {
            Detection detection = new Detection();
            detection.setAnalysisResult(analysisResult);
            
            // Extract fields
            detection.setLabel(anomaly.has("label") ? anomaly.get("label").asText() : "Unknown");
            detection.setCategory(anomaly.has("category") ? anomaly.get("category").asText() : "anomaly");
            detection.setSeverity(anomaly.has("severity") ? anomaly.get("severity").asText() : "Unknown");
            detection.setConfidence(anomaly.has("confidence") ? anomaly.get("confidence").asDouble() : 0.0);
            
            // Extract bbox
            if (anomaly.has("bbox")) {
                JsonNode bbox = anomaly.get("bbox");
                detection.setBboxX(bbox.has("x") ? bbox.get("x").asInt() : 0);
                detection.setBboxY(bbox.has("y") ? bbox.get("y").asInt() : 0);
                detection.setBboxWidth(bbox.has("width") ? bbox.get("width").asInt() : 0);
                detection.setBboxHeight(bbox.has("height") ? bbox.get("height").asInt() : 0);
            }
            
            detectionRepo.save(detection);
        }
    }
}
