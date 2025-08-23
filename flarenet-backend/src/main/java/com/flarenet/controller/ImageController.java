package com.flarenet.controller;

import com.flarenet.dto.ThermalImageResponse;
import com.flarenet.entity.ThermalImage;
import com.flarenet.entity.enums.ImageType;
import com.flarenet.entity.enums.WeatherCondition;
import com.flarenet.service.ThermalImageService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/transformers/{transformerId}/images")
@CrossOrigin(origins = "http://localhost:5173")
public class ImageController {
  private final ThermalImageService svc;
  public ImageController(ThermalImageService svc){ this.svc = svc; }

  @GetMapping public List<ThermalImage> list(@PathVariable Long transformerId){
    return svc.list(transformerId);
  }

  @PostMapping(consumes = {"multipart/form-data"})
  public ThermalImageResponse upload(@PathVariable Long transformerId,
    @RequestParam("file") MultipartFile file,
    @RequestParam("imageType") ImageType imageType,
    @RequestParam(value="weatherCondition", required=false) WeatherCondition weather,
    @RequestParam(value="uploader", required=false) String uploader) {

    ThermalImage img = svc.upload(transformerId, file, imageType, weather, uploader);
    ThermalImageResponse r = new ThermalImageResponse();
    r.id = img.getId(); r.transformerId = img.getTransformer().getId();
    r.imageType = img.getImageType(); r.weatherCondition = img.getWeatherCondition();
    r.uploader = img.getUploader(); r.fileName = img.getFileName();
    r.contentType = img.getContentType(); r.sizeBytes = img.getSizeBytes();
    r.filePath = img.getFilePath(); r.uploadedAt = img.getUploadedAt();
    return r;
  }
}
