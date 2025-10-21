package com.flarenet.service;

import com.flarenet.entity.AnalysisResult;
import com.flarenet.entity.ThermalImage;
import com.flarenet.entity.Transformer;
import com.flarenet.entity.UserAnnotation;
import com.flarenet.repository.AnalysisResultRepository;
import com.flarenet.repository.ThermalImageRepository;
import com.flarenet.repository.TransformerRepository;
import com.flarenet.repository.UserAnnotationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

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
    private RestTemplate restTemplate;

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
}
