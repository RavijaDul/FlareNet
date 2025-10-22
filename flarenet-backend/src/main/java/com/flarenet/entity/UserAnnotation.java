package com.flarenet.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "user_annotations")
public class UserAnnotation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thermal_image_id", nullable = false)
    private ThermalImage thermalImage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transformer_id", nullable = false)
    private Transformer transformer;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "annotations_json", columnDefinition = "TEXT", nullable = false)
    private String annotationsJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ThermalImage getThermalImage() { return thermalImage; }
    public void setThermalImage(ThermalImage thermalImage) { this.thermalImage = thermalImage; }

    public Transformer getTransformer() { return transformer; }
    public void setTransformer(Transformer transformer) { this.transformer = transformer; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getAnnotationsJson() { return annotationsJson; }
    public void setAnnotationsJson(String annotationsJson) { this.annotationsJson = annotationsJson; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
