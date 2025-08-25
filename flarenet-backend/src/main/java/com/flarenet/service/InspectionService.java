package com.flarenet.service;

import com.flarenet.dto.InspectionRequest;
import com.flarenet.dto.InspectionResponse;
import com.flarenet.entity.Inspection;
import com.flarenet.entity.Transformer;
import com.flarenet.repository.InspectionRepository;
import com.flarenet.repository.TransformerRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InspectionService {
  private final InspectionRepository inspectionRepo;
  private final TransformerRepository transformerRepo;

  public InspectionService(InspectionRepository inspectionRepo, TransformerRepository transformerRepo) {
    this.inspectionRepo = inspectionRepo;
    this.transformerRepo = transformerRepo;
  }

  public List<InspectionResponse> getInspectionsByTransformerId(Long transformerId) {
    return inspectionRepo.findByTransformerIdOrderByInspectedDateDesc(transformerId)
        .stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  public InspectionResponse create(InspectionRequest req) {
    Transformer transformer = transformerRepo.findById(req.transformerId)
        .orElseThrow(() -> new RuntimeException("Transformer not found"));

    Inspection inspection = new Inspection();
    inspection.setInspectionNumber(req.inspectionNumber);
    inspection.setInspectedDate(req.inspectedDate);
    inspection.setMaintenanceDate(req.maintenanceDate);
    //inspection.setStatus(req.status);
    inspection.setTransformer(transformer);

    return toResponse(inspectionRepo.save(inspection));
  }

  public InspectionResponse update(Long id, InspectionRequest req) {
    Inspection inspection = inspectionRepo.findById(id)
        .orElseThrow(() -> new RuntimeException("Inspection not found"));

    Transformer transformer = transformerRepo.findById(req.transformerId)
        .orElseThrow(() -> new RuntimeException("Transformer not found"));

    inspection.setInspectionNumber(req.inspectionNumber);
    inspection.setInspectedDate(req.inspectedDate);
    inspection.setMaintenanceDate(req.maintenanceDate);
    //inspection.setStatus(req.status);
    inspection.setTransformer(transformer);

    return toResponse(inspectionRepo.save(inspection));
  }

  public void delete(Long id) {
    inspectionRepo.deleteById(id);
  }

  public InspectionResponse getById(Long id) {
    return inspectionRepo.findById(id)
        .map(this::toResponse)
        .orElseThrow(() -> new RuntimeException("Inspection not found"));
  }

  private InspectionResponse toResponse(Inspection inspection) {
    InspectionResponse response = new InspectionResponse();
    response.id = inspection.getId();
    response.inspectionNumber = inspection.getInspectionNumber();
    response.inspectedDate = inspection.getInspectedDate();
    response.maintenanceDate = inspection.getMaintenanceDate();
    //response.status = inspection.getStatus();
    response.transformerId = inspection.getTransformer().getId();
    response.transformerNumber = inspection.getTransformer().getTransformerNo();
    response.createdAt = inspection.getCreatedAt();
    response.updatedAt = inspection.getUpdatedAt();
    return response;
  }
}
