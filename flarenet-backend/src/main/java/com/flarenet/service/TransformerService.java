package com.flarenet.service;

import com.flarenet.dto.TransformerRequest;
import com.flarenet.entity.Transformer;
import com.flarenet.repository.TransformerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class TransformerService {
  private final TransformerRepository repo;
  public TransformerService(TransformerRepository repo){ this.repo = repo; }

  public List<Transformer> list(){ return repo.findAll(); }

  @Transactional
  public Transformer create(TransformerRequest r){
    Transformer t = new Transformer();
    t.setTransformerNo(r.transformerNo);
    t.setRegion(r.region); t.setPoleNo(r.poleNo);
    t.setType(r.type); t.setLocationDetails(r.locationDetails);
    t.setCapacityKVA(r.capacityKVA);
    return repo.save(t);
  }

  public Transformer get(Long id){
    return repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Not found"));
  }

  @Transactional
  public Transformer update(Long id, TransformerRequest r){
    Transformer t = get(id);
    t.setRegion(r.region); t.setPoleNo(r.poleNo); t.setType(r.type);
    t.setLocationDetails(r.locationDetails); t.setCapacityKVA(r.capacityKVA);
    if (r.transformerNo != null && !r.transformerNo.isBlank()) t.setTransformerNo(r.transformerNo);
    return t;
  }

  public void delete(Long id){ repo.deleteById(id); }
}
