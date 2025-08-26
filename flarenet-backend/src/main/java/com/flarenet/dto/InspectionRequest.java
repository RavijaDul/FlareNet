package com.flarenet.dto;

//import com.flarenet.entity.enums.InspectionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public class InspectionRequest {
    @NotBlank public String branch;
    @NotNull public LocalDate inspectedDate;
    @NotNull public LocalTime inspectionTime;   // NEW
    public LocalDate maintenanceDate;
    @NotNull public Long transformerId;
}

