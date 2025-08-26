package com.flarenet.entity;
//
//import com.flarenet.entity.enums.InspectionStatus;
//import jakarta.persistence.*;
//import java.time.LocalDate;
//import java.time.Instant;
//
//@Entity
//public class Inspection {
//  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
//  private Long id;
//
//  @Column(nullable = false)
//  private String inspectionNumber;
//
//  @Column(nullable = false)
//  private LocalDate inspectedDate;
//
//  private LocalDate maintenanceDate;
//
//  @Enumerated(EnumType.STRING)
//  private InspectionStatus status;
//
//  private Instant createdAt = Instant.now();
//  private Instant updatedAt = Instant.now();
//
//  @ManyToOne(fetch = FetchType.LAZY)
//  @JoinColumn(name = "transformer_id", nullable = false)
//  private Transformer transformer;
//
//  @PreUpdate
//  public void touch() { this.updatedAt = Instant.now(); }
//
//  // getters and setters
//  public Long getId() { return id; }
//  public void setId(Long id) { this.id = id; }
//
//  public String getInspectionNumber() { return inspectionNumber; }
//  public void setInspectionNumber(String inspectionNumber) { this.inspectionNumber = inspectionNumber; }
//
//  public LocalDate getInspectedDate() { return inspectedDate; }
//  public void setInspectedDate(LocalDate inspectedDate) { this.inspectedDate = inspectedDate; }
//
//  public LocalDate getMaintenanceDate() { return maintenanceDate; }
//  public void setMaintenanceDate(LocalDate maintenanceDate) { this.maintenanceDate = maintenanceDate; }
//
//  public InspectionStatus getStatus() { return status; }
//  public void setStatus(InspectionStatus status) { this.status = status; }
//
//  public Instant getCreatedAt() { return createdAt; }
//  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
//
//  public Instant getUpdatedAt() { return updatedAt; }
//  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
//
//  public Transformer getTransformer() { return transformer; }
//  public void setTransformer(Transformer transformer) { this.transformer = transformer; }
//}

//package com.flarenet.backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "inspections")
public class Inspection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String inspectionNumber;  // will be auto-generated

    private String branch;
    private LocalDate inspectedDate;
    private LocalTime inspectionTime;   // NEW
    private LocalDate maintenanceDate;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING; // default to PENDING

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transformer_id")
    @JsonBackReference("transformer-inspections")
    private Transformer transformer;

    public enum Status { IN_PROGRESS, COMPLETED, PENDING }

    /* === getters/setters === */
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getInspectionNumber() { return inspectionNumber; }
    public void setInspectionNumber(String inspectionNumber) { this.inspectionNumber = inspectionNumber; }

    public LocalDate getInspectedDate() { return inspectedDate; }
    public void setInspectedDate(LocalDate inspectedDate) { this.inspectedDate = inspectedDate; }

    public LocalDate getMaintenanceDate() { return maintenanceDate; }
    public void setMaintenanceDate(LocalDate maintenanceDate) { this.maintenanceDate = maintenanceDate; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Transformer getTransformer() { return transformer; }
    public void setTransformer(Transformer transformer) { this.transformer = transformer; }

    // getters and setters for branch + inspectionTime
    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public LocalTime getInspectionTime() { return inspectionTime; }
    public void setInspectionTime(LocalTime inspectionTime) { this.inspectionTime = inspectionTime; }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.status == null) {
            this.status = Status.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

}
