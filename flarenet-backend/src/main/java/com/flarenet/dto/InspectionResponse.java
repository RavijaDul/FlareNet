package com.flarenet.dto;

import com.flarenet.entity.Inspection;
//import com.flarenet.entity.enums.InspectionStatus;
import java.time.LocalDate;
import java.time.Instant;
import java.time.LocalTime;

public class InspectionResponse {
    public Long id;
    public String inspectionNumber;
    public String branch;
    public LocalDate inspectedDate;
    public LocalTime inspectionTime;   // NEW
    public LocalDate maintenanceDate;
    public Inspection.Status status;
    public Long transformerId;
    public String transformerNumber;
    public Instant createdAt;
    public Instant updatedAt;
}

