package com.flarenet.controller;

import com.flarenet.dto.TransformerRequest;
import com.flarenet.dto.TransformerResponse;
import com.flarenet.entity.Transformer;
import com.flarenet.service.TransformerService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/transformers")
@CrossOrigin(origins = "http://localhost:5173")
public class TransformerController {
  private final TransformerService svc;
  public TransformerController(TransformerService svc){ this.svc = svc; }

  @GetMapping public List<Transformer> list(){ return svc.list(); }

  @PostMapping public TransformerResponse create(@Valid @RequestBody TransformerRequest req){
    Transformer t = svc.create(req);
    return toResp(t);
  }

  @GetMapping("/{id}") public Transformer get(@PathVariable Long id){ return svc.get(id); }

  @PutMapping("/{id}") public TransformerResponse update(@PathVariable Long id,
                              @Valid @RequestBody TransformerRequest req){
    return toResp(svc.update(id, req));
  }

  @DeleteMapping("/{id}") public void delete(@PathVariable Long id){ svc.delete(id); }

  private TransformerResponse toResp(Transformer t){
    TransformerResponse r = new TransformerResponse();
    r.id = t.getId(); r.transformerNo = t.getTransformerNo();
    r.region = t.getRegion(); r.poleNo = t.getPoleNo(); r.type = t.getType();
    r.locationDetails = t.getLocationDetails(); r.capacityKVA = t.getCapacityKVA();
    r.createdAt = t.getCreatedAt(); r.updatedAt = t.getUpdatedAt();
    return r;
  }
}
