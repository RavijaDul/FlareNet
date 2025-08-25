package com.flarenet.dto;

import com.flarenet.entity.enums.InspectionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class InspectionRequest {
  @NotBlank public String inspectionNumber;
  @NotNull public LocalDate inspectedDate;
  public LocalDate maintenanceDate;
  public InspectionStatus status;
  @NotNull public Long transformerId;
}
