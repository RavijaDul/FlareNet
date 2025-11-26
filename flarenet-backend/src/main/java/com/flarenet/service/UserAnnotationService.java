package com.flarenet.service;

import com.flarenet.entity.*;
import com.flarenet.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.*;

@Service
public class UserAnnotationService {

    @Autowired
    private UserAnnotationRepository userAnnotationRepository;

    @Autowired
    private ThermalImageRepository thermalImageRepository;

    @Autowired
    private TransformerRepository transformerRepository;

    @Autowired
    private AnalysisResultRepository analysisResultRepository;

    @Autowired
    private DetectionRepository detectionRepository;

    @Autowired
    private AnnotationActionRepository annotationActionRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    public Optional<UserAnnotation> getAnnotationsForImage(Long thermalImageId) {
        return userAnnotationRepository.findByThermalImageId(thermalImageId);
    }

    public UserAnnotation saveAnnotations(Long thermalImageId, String userId, String annotationsJson) {
        Optional<ThermalImage> thermalImageOpt = thermalImageRepository.findById(thermalImageId);
        if (!thermalImageOpt.isPresent()) {
            throw new RuntimeException("Thermal image not found");
        }

        ThermalImage thermalImage = thermalImageOpt.get();
        Transformer transformer = thermalImage.getTransformer();

        // Check if annotation already exists for this image
        Optional<UserAnnotation> existingAnnotation = userAnnotationRepository.findByThermalImageId(thermalImageId);

        UserAnnotation annotation;
        if (existingAnnotation.isPresent()) {
            // Update existing annotation
            annotation = existingAnnotation.get();
            annotation.setAnnotationsJson(annotationsJson);
            // @PreUpdate will handle updatedAt
        } else {
            // Create new annotation
            annotation = new UserAnnotation();
            annotation.setThermalImage(thermalImage);
            annotation.setTransformer(transformer);
            annotation.setUserId(userId);
            annotation.setAnnotationsJson(annotationsJson);
            // @PrePersist will handle createdAt and updatedAt
        }

        UserAnnotation savedAnnotation = userAnnotationRepository.save(annotation);

        // Populate annotation_action table with individual changes
        try {
            populateAnnotationActions(savedAnnotation, annotationsJson);
        } catch (Exception actionEx) {
            System.err.println("⚠️ Error populating annotation actions: " + actionEx.getMessage());
        }

        // Send feedback to Python adaptive system
        try {
            AnalysisResult analysisResult = analysisResultRepository.findByImageId(thermalImageId);
            String originalAnalysisJson = (analysisResult != null) ? analysisResult.getResultJson() : "{}";
            
            Map<String, Object> feedbackData = new HashMap<>();
            feedbackData.put("thermalImageId", thermalImageId);
            feedbackData.put("userId", userId);
            feedbackData.put("originalAnalysisJson", originalAnalysisJson);
            feedbackData.put("userAnnotationsJson", annotationsJson);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(feedbackData, headers);

            String pythonUrl = "http://localhost:5000/adaptive-feedback";
            restTemplate.postForObject(pythonUrl, request, String.class);
            
            System.out.println("✅ Adaptive feedback sent for image " + thermalImageId);
        } catch (Exception e) {
            System.err.println("⚠️ Failed to send adaptive feedback: " + e.getMessage());
            // Don't fail the annotation save if adaptive feedback fails
        }

        return savedAnnotation;
    }

    /**
     * Parse user annotations and populate annotation_action table
     */
    private void populateAnnotationActions(UserAnnotation userAnnotation, String annotationsJson) throws Exception {
        JsonNode userRoot = objectMapper.readTree(annotationsJson);
        JsonNode userAnomalies = userRoot.get("anomalies");
        
        if (userAnomalies == null || !userAnomalies.isArray()) {
            return;
        }
        
        // Get original detections for comparison
        Long thermalImageId = userAnnotation.getThermalImage().getId();
        AnalysisResult analysisResult = analysisResultRepository.findByImageId(thermalImageId);
        
        if (analysisResult == null) {
            System.err.println("⚠️ No analysis result found for image " + thermalImageId);
            return;
        }
        
        List<Detection> originalDetections = detectionRepository.findByAnalysisResultId(analysisResult.getId());
        Map<Integer, Detection> detectionMap = new HashMap<>();
        for (int i = 0; i < originalDetections.size(); i++) {
            detectionMap.put(i, originalDetections.get(i));
        }
        
        // Process each user anomaly
        for (int idx = 0; idx < userAnomalies.size(); idx++) {
            JsonNode userAnomaly = userAnomalies.get(idx);
            AnnotationAction action = new AnnotationAction();
            action.setUserAnnotation(userAnnotation);
            
            // Check if user added this detection
            boolean isUserAdded = userAnomaly.has("isUserAdded") && userAnomaly.get("isUserAdded").asBoolean();
            boolean isDeleted = userAnomaly.has("isDeleted") && userAnomaly.get("isDeleted").asBoolean();
            
            if (isUserAdded) {
                // User added new detection - only new_ fields, confidence = 1.0 for manual additions
                action.setActionType("ADDED");
                action.setDetection(null);  // No original detection
                action.setNewLabel(userAnomaly.has("label") ? userAnomaly.get("label").asText() : null);
                action.setNewCategory(userAnomaly.has("category") ? userAnomaly.get("category").asText() : null);
                action.setNewSeverity(userAnomaly.has("severity") ? userAnomaly.get("severity").asText() : null);
                action.setNewConfidence(1.0);  // Manual additions always have confidence 1.0
                
                if (userAnomaly.has("bbox")) {
                    JsonNode bbox = userAnomaly.get("bbox");
                    action.setNewBboxX(bbox.has("x") ? bbox.get("x").asInt() : null);
                    action.setNewBboxY(bbox.has("y") ? bbox.get("y").asInt() : null);
                    action.setNewBboxWidth(bbox.has("width") ? bbox.get("width").asInt() : null);
                    action.setNewBboxHeight(bbox.has("height") ? bbox.get("height").asInt() : null);
                }
            } else if (isDeleted) {
                // User deleted detection - only original fields, no new_ fields
                Detection originalDetection = detectionMap.get(idx);
                if (originalDetection != null) {
                    action.setActionType("DELETED");
                    action.setDetection(originalDetection);
                    action.setOriginalLabel(originalDetection.getLabel());
                    action.setOriginalCategory(originalDetection.getCategory());
                    action.setOriginalSeverity(originalDetection.getSeverity());
                    action.setOriginalConfidence(originalDetection.getConfidence());
                    action.setOriginalBboxX(originalDetection.getBboxX());
                    action.setOriginalBboxY(originalDetection.getBboxY());
                    action.setOriginalBboxWidth(originalDetection.getBboxWidth());
                    action.setOriginalBboxHeight(originalDetection.getBboxHeight());
                    // new_ fields remain null for deletions
                }
            } else {
                // Check if detection was edited
                Detection originalDetection = detectionMap.get(idx);
                if (originalDetection != null) {
                    boolean isEdited = userAnomaly.has("userEdited") && userAnomaly.get("userEdited").asBoolean();
                    
                    if (isEdited) {
                        // User edited detection - both original and new_ fields filled
                        action.setActionType("EDITED");
                        action.setDetection(originalDetection);
                        
                        // Store original values
                        action.setOriginalLabel(originalDetection.getLabel());
                        action.setOriginalCategory(originalDetection.getCategory());
                        action.setOriginalSeverity(originalDetection.getSeverity());
                        action.setOriginalConfidence(originalDetection.getConfidence());
                        action.setOriginalBboxX(originalDetection.getBboxX());
                        action.setOriginalBboxY(originalDetection.getBboxY());
                        action.setOriginalBboxWidth(originalDetection.getBboxWidth());
                        action.setOriginalBboxHeight(originalDetection.getBboxHeight());
                        
                        // Store new values (if not changed, copy from original)
                        String newLabel = userAnomaly.has("label") ? userAnomaly.get("label").asText() : originalDetection.getLabel();
                        String newCategory = userAnomaly.has("category") ? userAnomaly.get("category").asText() : originalDetection.getCategory();
                        String newSeverity = userAnomaly.has("severity") ? userAnomaly.get("severity").asText() : originalDetection.getSeverity();
                        Double newConfidence = 1.0;  // Manual edits always get confidence 1.0
                        
                        action.setNewLabel(newLabel);
                        action.setNewCategory(newCategory);
                        action.setNewSeverity(newSeverity);
                        action.setNewConfidence(newConfidence);
                        
                        // Handle bbox - if changed, use new values; otherwise use original
                        if (userAnomaly.has("bbox")) {
                            JsonNode bbox = userAnomaly.get("bbox");
                            action.setNewBboxX(bbox.has("x") ? bbox.get("x").asInt() : originalDetection.getBboxX());
                            action.setNewBboxY(bbox.has("y") ? bbox.get("y").asInt() : originalDetection.getBboxY());
                            action.setNewBboxWidth(bbox.has("width") ? bbox.get("width").asInt() : originalDetection.getBboxWidth());
                            action.setNewBboxHeight(bbox.has("height") ? bbox.get("height").asInt() : originalDetection.getBboxHeight());
                        } else {
                            // No bbox in user data, keep original
                            action.setNewBboxX(originalDetection.getBboxX());
                            action.setNewBboxY(originalDetection.getBboxY());
                            action.setNewBboxWidth(originalDetection.getBboxWidth());
                            action.setNewBboxHeight(originalDetection.getBboxHeight());
                        }
                    } else {
                        // Detection was confirmed without changes - only original fields
                        action.setActionType("CONFIRMED");
                        action.setDetection(originalDetection);
                        action.setOriginalLabel(originalDetection.getLabel());
                        action.setOriginalCategory(originalDetection.getCategory());
                        action.setOriginalSeverity(originalDetection.getSeverity());
                        action.setOriginalConfidence(originalDetection.getConfidence());
                        action.setOriginalBboxX(originalDetection.getBboxX());
                        action.setOriginalBboxY(originalDetection.getBboxY());
                        action.setOriginalBboxWidth(originalDetection.getBboxWidth());
                        action.setOriginalBboxHeight(originalDetection.getBboxHeight());
                        // new_ fields remain null for confirmations
                    }
                }
            }
            
            // Only save if action type is set
            if (action.getActionType() != null) {
                annotationActionRepository.save(action);
            }
        }
        
        System.out.println("✅ Populated annotation actions for user_annotation_id: " + userAnnotation.getId());
    }
}
