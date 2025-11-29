package com.flarenet.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "detection")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "analysisResult"})
public class Detection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_result_id", nullable = false)
    private AnalysisResult analysisResult;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, length = 50)
    private String severity;

    @Column(nullable = false)
    private Double confidence;

    @Column(name = "bbox_x", nullable = false)
    private Integer bboxX;

    @Column(name = "bbox_y", nullable = false)
    private Integer bboxY;

    @Column(name = "bbox_width", nullable = false)
    private Integer bboxWidth;

    @Column(name = "bbox_height", nullable = false)
    private Integer bboxHeight;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AnalysisResult getAnalysisResult() {
        return analysisResult;
    }

    public void setAnalysisResult(AnalysisResult analysisResult) {
        this.analysisResult = analysisResult;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public Integer getBboxX() {
        return bboxX;
    }

    public void setBboxX(Integer bboxX) {
        this.bboxX = bboxX;
    }

    public Integer getBboxY() {
        return bboxY;
    }

    public void setBboxY(Integer bboxY) {
        this.bboxY = bboxY;
    }

    public Integer getBboxWidth() {
        return bboxWidth;
    }

    public void setBboxWidth(Integer bboxWidth) {
        this.bboxWidth = bboxWidth;
    }

    public Integer getBboxHeight() {
        return bboxHeight;
    }

    public void setBboxHeight(Integer bboxHeight) {
        this.bboxHeight = bboxHeight;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
