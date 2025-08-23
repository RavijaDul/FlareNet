package com.flarenet.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class Transformer {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String transformerNo;

  private String region;
  private String poleNo;
  private String type;           // Bulk / Distribution
  private String locationDetails;
  private Double capacityKVA;

  private Instant createdAt = Instant.now();
  private Instant updatedAt = Instant.now();

  @PreUpdate
  public void touch() { this.updatedAt = Instant.now(); }

  // getters and setters
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getTransformerNo() { return transformerNo; }
  public void setTransformerNo(String transformerNo) { this.transformerNo = transformerNo; }
  public String getRegion() { return region; }
  public void setRegion(String region) { this.region = region; }
  public String getPoleNo() { return poleNo; }
  public void setPoleNo(String poleNo) { this.poleNo = poleNo; }
  public String getType() { return type; }
  public void setType(String type) { this.type = type; }
  public String getLocationDetails() { return locationDetails; }
  public void setLocationDetails(String locationDetails) { this.locationDetails = locationDetails; }
  public Double getCapacityKVA() { return capacityKVA; }
  public void setCapacityKVA(Double capacityKVA) { this.capacityKVA = capacityKVA; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
