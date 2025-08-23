package com.flarenet.entity;

import com.flarenet.entity.enums.ImageType;
import com.flarenet.entity.enums.WeatherCondition;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class ThermalImage {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  private Transformer transformer;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ImageType imageType;

  @Enumerated(EnumType.STRING)
  private WeatherCondition weatherCondition; // required if BASELINE

  private String uploader;
  private String fileName;
  private String contentType;
  private Long sizeBytes;
  private String filePath;
  private Instant uploadedAt = Instant.now();

  // getters and setters
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Transformer getTransformer() { return transformer; }
  public void setTransformer(Transformer transformer) { this.transformer = transformer; }
  public ImageType getImageType() { return imageType; }
  public void setImageType(ImageType imageType) { this.imageType = imageType; }
  public WeatherCondition getWeatherCondition() { return weatherCondition; }
  public void setWeatherCondition(WeatherCondition weatherCondition) { this.weatherCondition = weatherCondition; }
  public String getUploader() { return uploader; }
  public void setUploader(String uploader) { this.uploader = uploader; }
  public String getFileName() { return fileName; }
  public void setFileName(String fileName) { this.fileName = fileName; }
  public String getContentType() { return contentType; }
  public void setContentType(String contentType) { this.contentType = contentType; }
  public Long getSizeBytes() { return sizeBytes; }
  public void setSizeBytes(Long sizeBytes) { this.sizeBytes = sizeBytes; }
  public String getFilePath() { return filePath; }
  public void setFilePath(String filePath) { this.filePath = filePath; }
  public Instant getUploadedAt() { return uploadedAt; }
  public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }
}
