package com.flarenet.dto;

import java.time.Instant;

public class TransformerResponse {
  public Long id;
  public String transformerNo, region, poleNo, type, locationDetails;
  public Double capacityKVA;
  public Instant createdAt, updatedAt;
}
