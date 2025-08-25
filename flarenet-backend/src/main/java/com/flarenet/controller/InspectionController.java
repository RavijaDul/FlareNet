package com.flarenet.controller;

import com.flarenet.dto.InspectionRequest;
import com.flarenet.dto.InspectionResponse;
import com.flarenet.service.InspectionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/inspections")
@CrossOrigin(origins = "http://localhost:5173")
public class InspectionController {
  private final InspectionService svc;

  public InspectionController(InspectionService svc) {
    this.svc = svc;
  }

  @GetMapping("/transformer/{transformerId}")
  public List<InspectionResponse> getInspectionsByTransformer(@PathVariable Long transformerId) {
    return svc.getInspectionsByTransformerId(transformerId);
  }

  @PostMapping
  public InspectionResponse create(@Valid @RequestBody InspectionRequest req) {
    return svc.create(req);
  }

  @GetMapping("/{id}")
  public InspectionResponse get(@PathVariable Long id) {
    return svc.getById(id);
  }

  @PutMapping("/{id}")
  public InspectionResponse update(@PathVariable Long id, @Valid @RequestBody InspectionRequest req) {
    return svc.update(id, req);
  }

  @DeleteMapping("/{id}")
  public void delete(@PathVariable Long id) {
    svc.delete(id);
  }
}

