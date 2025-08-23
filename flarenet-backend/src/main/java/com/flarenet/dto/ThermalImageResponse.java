package com.flarenet.dto;

import com.flarenet.entity.enums.ImageType;
import com.flarenet.entity.enums.WeatherCondition;
import java.time.Instant;

public class ThermalImageResponse {
  public Long id, transformerId;
  public ImageType imageType;
  public WeatherCondition weatherCondition;
  public String uploader, fileName, contentType, filePath;
  public Long sizeBytes;
  public Instant uploadedAt;
}
