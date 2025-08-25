package com.flarenet.dto;

import com.flarenet.entity.enums.InspectionStatus;
import java.time.LocalDate;
import java.time.Instant;

public class InspectionResponse {
  public Long id;
  public String inspectionNumber;
  public LocalDate inspectedDate;
  public LocalDate maintenanceDate;
  public InspectionStatus status;
  public Long transformerId;
  public String transformerNumber;
  public Instant createdAt;
  public Instant updatedAt;
}
