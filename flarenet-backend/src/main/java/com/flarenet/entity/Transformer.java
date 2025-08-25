package com.flarenet.entity;
//
//import jakarta.persistence.*;
//import java.time.Instant;
//import java.util.List;
//import com.flarenet.entity.Inspection;
//
//@Entity
//public class Transformer {
//  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
//  private Long id;
//
//  @Column(nullable = false, unique = true)
//  private String transformerNo;
//
//  private String region;
//  private String poleNo;
//  private String type;           // Bulk / Distribution
//  private String locationDetails;
//  private Double capacityKVA;
//
//  private Instant createdAt = Instant.now();
//  private Instant updatedAt = Instant.now();
//
//  @OneToMany(mappedBy = "transformer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
//  private List<Inspection> inspections;
//
//  @PreUpdate
//  public void touch() { this.updatedAt = Instant.now(); }
//
//  // getters and setters
//  public Long getId() { return id; }
//  public void setId(Long id) { this.id = id; }
//  public String getTransformerNo() { return transformerNo; }
//  public void setTransformerNo(String transformerNo) { this.transformerNo = transformerNo; }
//  public String getRegion() { return region; }
//  public void setRegion(String region) { this.region = region; }
//  public String getPoleNo() { return poleNo; }
//  public void setPoleNo(String poleNo) { this.poleNo = poleNo; }
//  public String getType() { return type; }
//  public void setType(String type) { this.type = type; }
//  public String getLocationDetails() { return locationDetails; }
//  public void setLocationDetails(String locationDetails) { this.locationDetails = locationDetails; }
//  public Double getCapacityKVA() { return capacityKVA; }
//  public void setCapacityKVA(Double capacityKVA) { this.capacityKVA = capacityKVA; }
//  public Instant getCreatedAt() { return createdAt; }
//  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
//  public Instant getUpdatedAt() { return updatedAt; }
//  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
//
//  public List<Inspection> getInspections() { return inspections; }
//  public void setInspections(List<Inspection> inspections) { this.inspections = inspections; }
//}
//package com.flarenet.backend.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "transformers")
public class Transformer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String transformerNo;
    private String region;
    private String poleNo;
    private String type;
    private String locationDetails;
    private Double capacityKVA;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @OneToMany(
            mappedBy = "transformer",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @JsonManagedReference("transformer-inspections")
    private List<Inspection> inspections = new ArrayList<>();

    /* === convenience methods (optional) === */
    public void addInspection(Inspection i) {
        inspections.add(i);
        i.setTransformer(this);
    }
    public void removeInspection(Inspection i) {
        inspections.remove(i);
        i.setTransformer(null);
    }

    /* === getters/setters === */
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

    public List<Inspection> getInspections() { return inspections; }
    public void setInspections(List<Inspection> inspections) { this.inspections = inspections; }

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
