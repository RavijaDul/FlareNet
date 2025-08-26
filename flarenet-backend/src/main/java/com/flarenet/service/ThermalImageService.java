//package com.flarenet.service;
//
//import com.flarenet.entity.Inspection;
//import com.flarenet.entity.ThermalImage;
//import com.flarenet.entity.Transformer;
//import com.flarenet.entity.enums.ImageType;
//import com.flarenet.entity.enums.WeatherCondition;
//import com.flarenet.repository.InspectionRepository;
//import com.flarenet.repository.ThermalImageRepository;
//import com.flarenet.repository.TransformerRepository;
//import com.flarenet.service.storage.StorageService;
//import org.springframework.http.MediaType;
//import org.springframework.stereotype.Service;
//import org.springframework.web.multipart.MultipartFile;
//
//import java.nio.file.Path;
//import java.util.List;
//
//@Service
//public class ThermalImageService {
//  private final ThermalImageRepository images;
//  private final TransformerRepository transformers;
//  private final InspectionRepository inspections;
//  private final StorageService storage;
//
//  public ThermalImageService(ThermalImageRepository images, TransformerRepository transformers,
//                             InspectionRepository inspections, StorageService storage) {
//    this.images = images; this.transformers = transformers; this.inspections = inspections; this.storage = storage;
//  }
//
//  public ThermalImage upload(Long transformerId, MultipartFile file, ImageType type,
//                             WeatherCondition weather, String uploader, Long inspectionId) {
//    Transformer t = transformers.findById(transformerId)
//      .orElseThrow(() -> new IllegalArgumentException("Transformer not found"));
//
//    if (type == ImageType.BASELINE && weather == null)
//      throw new IllegalArgumentException("Baseline image requires weather condition");
//
//    Path stored = storage.store(transformerId, file);
//    ThermalImage img = new ThermalImage();
//    img.setTransformer(t);
//    img.setImageType(type);
//    img.setWeatherCondition(weather);
//    img.setUploader(uploader);
//    img.setFileName(file.getOriginalFilename());
//    img.setContentType(file.getContentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : file.getContentType());
//    img.setSizeBytes(file.getSize());
//    img.setFilePath(stored.toString());
//
//    // Set inspection if provided
//    if (inspectionId != null) {
//      Inspection inspection = inspections.findById(inspectionId)
//        .orElseThrow(() -> new IllegalArgumentException("Inspection not found"));
//      img.setInspection(inspection);
//    }
//
//    return images.save(img);
//  }
//
//  public List<ThermalImage> list(Long transformerId){ return images.findByTransformerId(transformerId); }
//
//  public ThermalImage getImageById(Long imageId) {
//    return images.findById(imageId)
//      .orElseThrow(() -> new IllegalArgumentException("Image not found"));
//  }
//}
// MultipleFiles/ThermalImageService.java
package com.flarenet.service;

import com.flarenet.entity.Inspection;
import com.flarenet.entity.ThermalImage;
import com.flarenet.entity.Transformer;
import com.flarenet.entity.enums.ImageType;
import com.flarenet.entity.enums.WeatherCondition;
import com.flarenet.repository.InspectionRepository;
import com.flarenet.repository.ThermalImageRepository;
import com.flarenet.repository.TransformerRepository;
import com.flarenet.service.storage.StorageService;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;
import java.util.Optional; // Import Optional

@Service
public class ThermalImageService {
    private final ThermalImageRepository images;
    private final TransformerRepository transformers;
    private final InspectionRepository inspections;
    private final StorageService storage;

    public ThermalImageService(ThermalImageRepository images, TransformerRepository transformers,
                               InspectionRepository inspections, StorageService storage) {
        this.images = images; this.transformers = transformers; this.inspections = inspections; this.storage = storage;
    }

    public ThermalImage upload(Long transformerId, MultipartFile file, ImageType type,
                               WeatherCondition weather, String uploader, Long inspectionId) {
        Transformer t = transformers.findById(transformerId)
                .orElseThrow(() -> new IllegalArgumentException("Transformer not found"));

        // --- NEW LOGIC FOR BASELINE ---
        if (type == ImageType.BASELINE) {
            // Check if a BASELINE image already exists for this transformer
            Optional<ThermalImage> existingBaseline = images.findByTransformerAndImageType(t, ImageType.BASELINE)
                    .stream().findFirst(); // Get the first one if multiple exist (shouldn't happen with this logic)
            if (existingBaseline.isPresent()) {
                // If a baseline already exists, return it and don't upload a new one
                // Or throw an exception if you want to strictly enforce only one upload attempt
                // For now, we'll return the existing one, implying it's already handled.
                return existingBaseline.get();
            }
            if (weather == null) {
                throw new IllegalArgumentException("Baseline image requires weather condition");
            }
        }
        // --- END NEW LOGIC FOR BASELINE ---

        Path stored = storage.store(transformerId, file);
        ThermalImage img = new ThermalImage();
        img.setTransformer(t);
        img.setImageType(type);
        img.setWeatherCondition(weather); // weather can be null for MAINTENANCE
        img.setUploader(uploader);
        img.setFileName(file.getOriginalFilename());
        img.setContentType(file.getContentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : file.getContentType());
        img.setSizeBytes(file.getSize());
        img.setFilePath(stored.toString());

        // Set inspection if provided
        if (inspectionId != null) {
            Inspection inspection = inspections.findById(inspectionId)
                    .orElseThrow(() -> new IllegalArgumentException("Inspection not found"));
            img.setInspection(inspection);
        }

        return images.save(img);
    }

    public List<ThermalImage> list(Long transformerId){
        return images.findByTransformerId(transformerId);
    }

    // --- NEW METHOD: Get baseline image for a transformer ---
    public Optional<ThermalImage> getBaselineImageForTransformer(Long transformerId) {
        Transformer t = transformers.findById(transformerId)
                .orElseThrow(() -> new IllegalArgumentException("Transformer not found"));
        return images.findByTransformerAndImageType(t, ImageType.BASELINE).stream().findFirst();
    }

    // --- NEW METHOD: Get maintenance images for a specific inspection ---
    public List<ThermalImage> getMaintenanceImagesForInspection(Long inspectionId) {
        Inspection inspection = inspections.findById(inspectionId)
                .orElseThrow(() -> new IllegalArgumentException("Inspection not found"));
        return images.findByInspectionAndImageType(inspection, ImageType.MAINTENANCE);
    }

    public ThermalImage getImageById(Long imageId) {
        return images.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("Image not found"));
    }

    // MultipleFiles/ThermalImageService.java
    public void deleteBaselineImage(Long transformerId) {
        Transformer t = transformers.findById(transformerId)
                .orElseThrow(() -> new IllegalArgumentException("Transformer not found"));

        // Find the existing baseline image
        ThermalImage baselineImage = images.findByTransformerAndImageType(t, ImageType.BASELINE)
                .stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No baseline image found for this transformer"));

        // Delete the image from storage (if applicable)
        storage.delete(baselineImage.getFilePath()); // Assuming you have a delete method in your StorageService

        // Delete the image record from the database
        images.delete(baselineImage);
    }

}
