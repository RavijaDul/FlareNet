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

//  private String generateInspectionNumber() {
//    Long lastId = inspectionRepo.findMaxId().orElse(19999L);
//    return String.valueOf(lastId + 1);
//  }
    private String generateInspectionNumber() {
        // Get the current max inspection number from the database
        Long lastNumber = inspectionRepo.findMaxInspectionNumber()
                .orElse(19999L);  // Start at 20000 if none exists
        return String.valueOf(lastNumber + 1);
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
    inspection.setInspectionNumber(generateInspectionNumber()); // system generated
    inspection.setBranch(req.branch);
    inspection.setInspectedDate(req.inspectedDate);
    inspection.setInspectionTime(req.inspectionTime);
    inspection.setMaintenanceDate(req.maintenanceDate);
    inspection.setStatus(Inspection.Status.PENDING); // default
    inspection.setTransformer(transformer);

    return toResponse(inspectionRepo.save(inspection));
  }

  public InspectionResponse update(Long id, InspectionRequest req) {
        Inspection inspection = inspectionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Inspection not found"));

        Transformer transformer = transformerRepo.findById(req.transformerId)
                .orElseThrow(() -> new RuntimeException("Transformer not found"));

        inspection.setBranch(req.branch);
        inspection.setInspectedDate(req.inspectedDate);
        inspection.setInspectionTime(req.inspectionTime);
        inspection.setMaintenanceDate(req.maintenanceDate);
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
        response.branch = inspection.getBranch();
        response.inspectedDate = inspection.getInspectedDate();
        response.inspectionTime = inspection.getInspectionTime();
        response.maintenanceDate = inspection.getMaintenanceDate();
        response.status = inspection.getStatus();
        response.transformerId = inspection.getTransformer().getId();
        response.transformerNumber = inspection.getTransformer().getTransformerNo();
        response.createdAt = inspection.getCreatedAt();
        response.updatedAt = inspection.getUpdatedAt();
        return response;
    }

}
