package com.flarenet.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "analysis_result")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "image"})
public class AnalysisResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thermal_image_id", unique = true)
    private ThermalImage image;

    @Column(columnDefinition = "TEXT")
    private String resultJson;  // Keep for backward compatibility

    @Column(length = 50)
    private String status;  // 'Normal' or 'Anomalies'

    @Column(name = "total_detections")
    private Integer totalDetections = 0;

    @Column(name = "critical_count")
    private Integer criticalCount = 0;

    @Column(name = "potentially_faulty_count")
    private Integer potentiallyFaultyCount = 0;

    @Column(name = "analyzed_at")
    private Instant analyzedAt = Instant.now();

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ThermalImage getImage() { return image; }
    public void setImage(ThermalImage image) { this.image = image; }

    public String getResultJson() { return resultJson; }
    public void setResultJson(String resultJson) { this.resultJson = resultJson; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getTotalDetections() { return totalDetections; }
    public void setTotalDetections(Integer totalDetections) { this.totalDetections = totalDetections; }

    public Integer getCriticalCount() { return criticalCount; }
    public void setCriticalCount(Integer criticalCount) { this.criticalCount = criticalCount; }

    public Integer getPotentiallyFaultyCount() { return potentiallyFaultyCount; }
    public void setPotentiallyFaultyCount(Integer potentiallyFaultyCount) { this.potentiallyFaultyCount = potentiallyFaultyCount; }

    public Instant getAnalyzedAt() { return analyzedAt; }
    public void setAnalyzedAt(Instant analyzedAt) { this.analyzedAt = analyzedAt; }
}
