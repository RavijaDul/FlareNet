package com.flarenet.dto;

import jakarta.validation.constraints.NotBlank;

public class TransformerRequest {
  @NotBlank public String transformerNo;
  public String region;
  public String poleNo;
  public String type;
  public String locationDetails;
  public Double capacityKVA;
}
