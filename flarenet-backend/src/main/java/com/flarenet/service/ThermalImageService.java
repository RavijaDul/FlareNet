package com.flarenet.service;

import com.flarenet.entity.ThermalImage;
import com.flarenet.entity.Transformer;
import com.flarenet.entity.enums.ImageType;
import com.flarenet.entity.enums.WeatherCondition;
import com.flarenet.repository.ThermalImageRepository;
import com.flarenet.repository.TransformerRepository;
import com.flarenet.service.storage.StorageService;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;

@Service
public class ThermalImageService {
  private final ThermalImageRepository images;
  private final TransformerRepository transformers;
  private final StorageService storage;

  public ThermalImageService(ThermalImageRepository images, TransformerRepository transformers,
                             StorageService storage) {
    this.images = images; this.transformers = transformers; this.storage = storage;
  }

  public ThermalImage upload(Long transformerId, MultipartFile file, ImageType type,
                             WeatherCondition weather, String uploader) {
    Transformer t = transformers.findById(transformerId)
      .orElseThrow(() -> new IllegalArgumentException("Transformer not found"));

    if (type == ImageType.BASELINE && weather == null)
      throw new IllegalArgumentException("Baseline image requires weather condition");

    Path stored = storage.store(transformerId, file);
    ThermalImage img = new ThermalImage();
    img.setTransformer(t);
    img.setImageType(type);
    img.setWeatherCondition(weather);
    img.setUploader(uploader);
    img.setFileName(file.getOriginalFilename());
    img.setContentType(file.getContentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : file.getContentType());
    img.setSizeBytes(file.getSize());
    img.setFilePath(stored.toString());
    return images.save(img);
  }

  public List<ThermalImage> list(Long transformerId){ return images.findByTransformerId(transformerId); }
}
