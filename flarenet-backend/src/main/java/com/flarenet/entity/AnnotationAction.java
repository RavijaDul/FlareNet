package com.flarenet.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "annotation_action")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "userAnnotation", "detection"})
public class AnnotationAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_annotation_id", nullable = false)
    private UserAnnotation userAnnotation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "detection_id")
    private Detection detection;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    @Column(name = "original_label", length = 100)
    private String originalLabel;

    @Column(name = "new_label", length = 100)
    private String newLabel;

    @Column(name = "original_category", length = 50)
    private String originalCategory;

    @Column(name = "new_category", length = 50)
    private String newCategory;

    @Column(name = "original_severity", length = 50)
    private String originalSeverity;

    @Column(name = "new_severity", length = 50)
    private String newSeverity;

    @Column(name = "original_confidence")
    private Double originalConfidence;

    @Column(name = "new_confidence")
    private Double newConfidence;

    @Column(name = "original_bbox_x")
    private Integer originalBboxX;

    @Column(name = "original_bbox_y")
    private Integer originalBboxY;

    @Column(name = "original_bbox_width")
    private Integer originalBboxWidth;

    @Column(name = "original_bbox_height")
    private Integer originalBboxHeight;

    @Column(name = "new_bbox_x")
    private Integer newBboxX;

    @Column(name = "new_bbox_y")
    private Integer newBboxY;

    @Column(name = "new_bbox_width")
    private Integer newBboxWidth;

    @Column(name = "new_bbox_height")
    private Integer newBboxHeight;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserAnnotation getUserAnnotation() {
        return userAnnotation;
    }

    public void setUserAnnotation(UserAnnotation userAnnotation) {
        this.userAnnotation = userAnnotation;
    }

    public Detection getDetection() {
        return detection;
    }

    public void setDetection(Detection detection) {
        this.detection = detection;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getOriginalLabel() {
        return originalLabel;
    }

    public void setOriginalLabel(String originalLabel) {
        this.originalLabel = originalLabel;
    }

    public String getNewLabel() {
        return newLabel;
    }

    public void setNewLabel(String newLabel) {
        this.newLabel = newLabel;
    }

    public String getOriginalCategory() {
        return originalCategory;
    }

    public void setOriginalCategory(String originalCategory) {
        this.originalCategory = originalCategory;
    }

    public String getNewCategory() {
        return newCategory;
    }

    public void setNewCategory(String newCategory) {
        this.newCategory = newCategory;
    }

    public String getOriginalSeverity() {
        return originalSeverity;
    }

    public void setOriginalSeverity(String originalSeverity) {
        this.originalSeverity = originalSeverity;
    }

    public String getNewSeverity() {
        return newSeverity;
    }

    public void setNewSeverity(String newSeverity) {
        this.newSeverity = newSeverity;
    }

    public Double getOriginalConfidence() {
        return originalConfidence;
    }

    public void setOriginalConfidence(Double originalConfidence) {
        this.originalConfidence = originalConfidence;
    }

    public Double getNewConfidence() {
        return newConfidence;
    }

    public void setNewConfidence(Double newConfidence) {
        this.newConfidence = newConfidence;
    }

    public Integer getOriginalBboxX() {
        return originalBboxX;
    }

    public void setOriginalBboxX(Integer originalBboxX) {
        this.originalBboxX = originalBboxX;
    }

    public Integer getOriginalBboxY() {
        return originalBboxY;
    }

    public void setOriginalBboxY(Integer originalBboxY) {
        this.originalBboxY = originalBboxY;
    }

    public Integer getOriginalBboxWidth() {
        return originalBboxWidth;
    }

    public void setOriginalBboxWidth(Integer originalBboxWidth) {
        this.originalBboxWidth = originalBboxWidth;
    }

    public Integer getOriginalBboxHeight() {
        return originalBboxHeight;
    }

    public void setOriginalBboxHeight(Integer originalBboxHeight) {
        this.originalBboxHeight = originalBboxHeight;
    }

    public Integer getNewBboxX() {
        return newBboxX;
    }

    public void setNewBboxX(Integer newBboxX) {
        this.newBboxX = newBboxX;
    }

    public Integer getNewBboxY() {
        return newBboxY;
    }

    public void setNewBboxY(Integer newBboxY) {
        this.newBboxY = newBboxY;
    }

    public Integer getNewBboxWidth() {
        return newBboxWidth;
    }

    public void setNewBboxWidth(Integer newBboxWidth) {
        this.newBboxWidth = newBboxWidth;
    }

    public Integer getNewBboxHeight() {
        return newBboxHeight;
    }

    public void setNewBboxHeight(Integer newBboxHeight) {
        this.newBboxHeight = newBboxHeight;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
