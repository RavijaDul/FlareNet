package com.flarenet.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class AnalysisResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thermal_image_id")
    private ThermalImage image;

    @Lob
    private String resultJson; // JSON returned from Python backend

    private Instant analyzedAt = Instant.now();

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ThermalImage getImage() { return image; }
    public void setImage(ThermalImage image) { this.image = image; }

    public String getResultJson() { return resultJson; }
    public void setResultJson(String resultJson) { this.resultJson = resultJson; }

    public Instant getAnalyzedAt() { return analyzedAt; }
    public void setAnalyzedAt(Instant analyzedAt) { this.analyzedAt = analyzedAt; }
}
