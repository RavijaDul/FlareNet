package com.flarenet.service;

import com.flarenet.entity.ThermalImage;
import com.flarenet.entity.Transformer;
import com.flarenet.entity.UserAnnotation;
import com.flarenet.repository.ThermalImageRepository;
import com.flarenet.repository.TransformerRepository;
import com.flarenet.repository.UserAnnotationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

@Service
public class UserAnnotationService {

    @Autowired
    private UserAnnotationRepository userAnnotationRepository;

    @Autowired
    private ThermalImageRepository thermalImageRepository;

    @Autowired
    private TransformerRepository transformerRepository;

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

        return userAnnotationRepository.save(annotation);
    }
}
