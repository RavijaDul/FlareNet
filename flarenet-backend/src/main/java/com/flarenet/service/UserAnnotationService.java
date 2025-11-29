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
        // Map detections by id for reliable lookup. We'll also keep the list for IoU matching when no id is provided.
        Map<Long, Detection> detectionById = new HashMap<>();
        for (Detection d : originalDetections) {
            if (d.getId() != null) detectionById.put(d.getId(), d);
        }
        
        // Process each user anomaly
        for (int idx = 0; idx < userAnomalies.size(); idx++) {
            JsonNode userAnomaly = userAnomalies.get(idx);
            AnnotationAction action = new AnnotationAction();
            action.setUserAnnotation(userAnnotation);
            
            // Check if user added this detection
            boolean isUserAdded = userAnomaly.has("isUserAdded") && userAnomaly.get("isUserAdded").asBoolean();
            boolean isDeleted = userAnomaly.has("isDeleted") && userAnomaly.get("isDeleted").asBoolean();

            // Attempt to resolve the original detection either by explicit id sent from frontend
            // or by finding the best-overlapping detection (IoU). This is more robust than index-based mapping.
            Detection originalDetection = null;
            if (userAnomaly.has("detectionId") && !userAnomaly.get("detectionId").isNull()) {
                long detId = userAnomaly.get("detectionId").asLong();
                originalDetection = detectionById.get(detId);
            }

            if (originalDetection == null && userAnomaly.has("bbox")) {
                // Find best overlap (IoU) among original detections
                JsonNode bbox = userAnomaly.get("bbox");
                Integer ux = bbox.has("x") ? bbox.get("x").asInt() : null;
                Integer uy = bbox.has("y") ? bbox.get("y").asInt() : null;
                Integer uw = bbox.has("width") ? bbox.get("width").asInt() : null;
                Integer uh = bbox.has("height") ? bbox.get("height").asInt() : null;
                if (ux != null && uy != null && uw != null && uh != null) {
                    double bestIoU = 0.0;
                    Detection best = null;
                    for (Detection d : originalDetections) {
                        double iou = computeIoU(ux, uy, uw, uh, d.getBboxX(), d.getBboxY(), d.getBboxWidth(), d.getBboxHeight());
                        if (iou > bestIoU) { bestIoU = iou; best = d; }
                    }
                    // Accept match only if IoU reasonably high (e.g., > 0.2)
                    if (best != null && bestIoU > 0.20) {
                        originalDetection = best;
                    }
                }
            }

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
                if (originalDetection != null) {
                        // Accept several possible frontend flags: `userEdited` (old), `edited` (current), or presence of `editedAt`.
                        boolean isEdited = (userAnomaly.has("userEdited") && userAnomaly.get("userEdited").asBoolean())
                            || (userAnomaly.has("edited") && userAnomaly.get("edited").asBoolean())
                            || userAnomaly.has("editedAt");

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

                        // Store new values (if not changed, copy from original). Some frontends may omit fields,
                        // so prefer values from userAnomaly when present.
                        String newLabel = userAnomaly.has("label") && !userAnomaly.get("label").isNull()
                            ? userAnomaly.get("label").asText() : originalDetection.getLabel();
                        String newCategory = userAnomaly.has("category") && !userAnomaly.get("category").isNull()
                            ? userAnomaly.get("category").asText() : originalDetection.getCategory();
                        String newSeverity = userAnomaly.has("severity") && !userAnomaly.get("severity").isNull()
                            ? userAnomaly.get("severity").asText() : originalDetection.getSeverity();
                        // If frontend provided a confidence (e.g., set to 1 on edit), use it; otherwise default to 1.0 for manual edits
                        Double newConfidence = (userAnomaly.has("confidence") && !userAnomaly.get("confidence").isNull())
                            ? userAnomaly.get("confidence").asDouble() : 1.0;

                        action.setNewLabel(newLabel);
                        action.setNewCategory(newCategory);
                        action.setNewSeverity(newSeverity);
                        action.setNewConfidence(newConfidence);

                        // Handle bbox - if changed, use new values; otherwise use original
                        if (userAnomaly.has("bbox")) {
                            JsonNode bbox = userAnomaly.get("bbox");
                            action.setNewBboxX(bbox.has("x") && !bbox.get("x").isNull() ? bbox.get("x").asInt() : originalDetection.getBboxX());
                            action.setNewBboxY(bbox.has("y") && !bbox.get("y").isNull() ? bbox.get("y").asInt() : originalDetection.getBboxY());
                            action.setNewBboxWidth(bbox.has("width") && !bbox.get("width").isNull() ? bbox.get("width").asInt() : originalDetection.getBboxWidth());
                            action.setNewBboxHeight(bbox.has("height") && !bbox.get("height").isNull() ? bbox.get("height").asInt() : originalDetection.getBboxHeight());
                        } else {
                            // No bbox in user data, keep original
                            action.setNewBboxX(originalDetection.getBboxX());
                            action.setNewBboxY(originalDetection.getBboxY());
                            action.setNewBboxWidth(originalDetection.getBboxWidth());
                            action.setNewBboxHeight(originalDetection.getBboxHeight());
                        }
                        // Ensure new label/category/severity/confidence are set on action
                        action.setNewLabel(newLabel);
                        action.setNewCategory(newCategory);
                        action.setNewSeverity(newSeverity);
                        action.setNewConfidence(newConfidence);
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

    /**
     * Compute Intersection over Union for two axis-aligned bboxes.
     */
    private double computeIoU(Integer ax, Integer ay, Integer aw, Integer ah,
                              Integer bx, Integer by, Integer bw, Integer bh) {
        if (ax == null || ay == null || aw == null || ah == null || bx == null || by == null || bw == null || bh == null) return 0.0;
        int a_x1 = ax;
        int a_y1 = ay;
        int a_x2 = ax + aw;
        int a_y2 = ay + ah;

        int b_x1 = bx;
        int b_y1 = by;
        int b_x2 = bx + bw;
        int b_y2 = by + bh;

        int inter_x1 = Math.max(a_x1, b_x1);
        int inter_y1 = Math.max(a_y1, b_y1);
        int inter_x2 = Math.min(a_x2, b_x2);
        int inter_y2 = Math.min(a_y2, b_y2);

        int interW = inter_x2 - inter_x1;
        int interH = inter_y2 - inter_y1;
        if (interW <= 0 || interH <= 0) return 0.0;

        double interArea = (double) interW * interH;
        double areaA = (double) aw * ah;
        double areaB = (double) bw * bh;
        double union = areaA + areaB - interArea;
        if (union <= 0) return 0.0;
        return interArea / union;
    }
}
