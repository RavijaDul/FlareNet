package com.flarenet.controller;

import com.flarenet.entity.UserAnnotation;
import com.flarenet.service.UserAnnotationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/annotations")
@CrossOrigin(origins = "http://localhost:5173")
public class AnnotationController {

    @Autowired
    private UserAnnotationService userAnnotationService;

    @GetMapping("/image/{thermalImageId}")
    public ResponseEntity<String> getAnnotationsForImage(@PathVariable Long thermalImageId) {
        Optional<UserAnnotation> annotation = userAnnotationService.getAnnotationsForImage(thermalImageId);
        if (annotation.isPresent()) {
            return ResponseEntity.ok(annotation.get().getAnnotationsJson());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/image/{thermalImageId}")
    public ResponseEntity<Void> saveAnnotations(
            @PathVariable Long thermalImageId,
            @RequestParam(value = "userId", defaultValue = "user") String userId,
            @RequestBody String annotationsJson) {

        try {
            userAnnotationService.saveAnnotations(thermalImageId, userId, annotationsJson);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace(); // Add logging for debugging
            return ResponseEntity.internalServerError().build();
        }
    }
}
