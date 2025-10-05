package com.flarenet.service;

import com.flarenet.entity.*;
import com.flarenet.entity.enums.ImageType;
import com.flarenet.entity.enums.WeatherCondition;
import com.flarenet.repository.*;
import com.flarenet.service.storage.StorageService;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.FileSystemResource;
import org.springframework.util.LinkedMultiValueMap;

import java.nio.file.Path;
import java.util.*;

@Service
public class ThermalImageService {

    private final ThermalImageRepository images;
    private final TransformerRepository transformers;
    private final InspectionRepository inspections;
    private final StorageService storage;
    private final AnalysisResultRepository analysisRepo;
    private final RestTemplate restTemplate;

    public ThermalImageService(
            ThermalImageRepository images,
            TransformerRepository transformers,
            InspectionRepository inspections,
            StorageService storage,
            AnalysisResultRepository analysisRepo,
            RestTemplate restTemplate
    ) {
        this.images = images;
        this.transformers = transformers;
        this.inspections = inspections;
        this.storage = storage;
        this.analysisRepo = analysisRepo;
        this.restTemplate = restTemplate;
    }

    public ThermalImage upload(Long transformerId, MultipartFile file, ImageType type,
                               WeatherCondition weather, String uploader, Long inspectionId) {

        Transformer t = transformers.findById(transformerId)
                .orElseThrow(() -> new IllegalArgumentException("Transformer not found"));

        if (type == ImageType.BASELINE) {
            Optional<ThermalImage> existingBaseline = images.findByTransformerAndImageType(t, ImageType.BASELINE)
                    .stream().findFirst();
            if (existingBaseline.isPresent()) {
                return existingBaseline.get();
            }
            if (weather == null) {
                throw new IllegalArgumentException("Baseline image requires weather condition");
            }
        }

        Path stored = storage.store(transformerId, file);
        ThermalImage img = new ThermalImage();
        img.setTransformer(t);
        img.setImageType(type);
        img.setWeatherCondition(weather);
        img.setUploader(uploader);
        img.setFileName(file.getOriginalFilename());
        img.setContentType(file.getContentType() == null
                ? MediaType.APPLICATION_OCTET_STREAM_VALUE
                : file.getContentType());
        img.setSizeBytes(file.getSize());
        img.setFilePath(stored.toString());

        if (inspectionId != null) {
            Inspection inspection = inspections.findById(inspectionId)
                    .orElseThrow(() -> new IllegalArgumentException("Inspection not found"));
            img.setInspection(inspection);
        }

        ThermalImage saved = images.save(img);

        // --- NEW: If maintenance image, send to Python backend ---
        if (type == ImageType.MAINTENANCE) {
            try {
                String pythonUrl = "http://localhost:5000/analyze";
                FileSystemResource fileResource = new FileSystemResource(saved.getFilePath());

                LinkedMultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                body.add("file", fileResource);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);

                HttpEntity<LinkedMultiValueMap<String, Object>> requestEntity =
                        new HttpEntity<>(body, headers);

                ResponseEntity<String> response =
                        restTemplate.postForEntity(pythonUrl, requestEntity, String.class);

                if (response.getStatusCode().is2xxSuccessful()) {
                    AnalysisResult result = new AnalysisResult();
                    result.setImage(saved);
                    result.setResultJson(response.getBody());
                    analysisRepo.save(result);
                } else {
                    System.err.println("⚠️ Python backend returned: " + response.getStatusCode());
                }

            } catch (Exception e) {
                System.err.println("⚠️ Error calling Python backend: " + e.getMessage());
            }
        }

        return saved;
    }

    public List<ThermalImage> list(Long transformerId) {
        return images.findByTransformerId(transformerId);
    }

    public Optional<ThermalImage> getBaselineImageForTransformer(Long transformerId) {
        Transformer t = transformers.findById(transformerId)
                .orElseThrow(() -> new IllegalArgumentException("Transformer not found"));
        return images.findByTransformerAndImageType(t, ImageType.BASELINE).stream().findFirst();
    }

    public List<ThermalImage> getMaintenanceImagesForInspection(Long inspectionId) {
        Inspection inspection = inspections.findById(inspectionId)
                .orElseThrow(() -> new IllegalArgumentException("Inspection not found"));
        return images.findByInspectionAndImageType(inspection, ImageType.MAINTENANCE);
    }

    public ThermalImage getImageById(Long imageId) {
        return images.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("Image not found"));
    }

    public void deleteBaselineImage(Long transformerId) {
        Transformer t = transformers.findById(transformerId)
                .orElseThrow(() -> new IllegalArgumentException("Transformer not found"));

        ThermalImage baselineImage = images.findByTransformerAndImageType(t, ImageType.BASELINE)
                .stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No baseline image found"));

        storage.delete(baselineImage.getFilePath());
        images.delete(baselineImage);
    }

    public void deleteImageById(Long imageId) {
        ThermalImage image = images.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("Image not found"));

        // Delete file from storage
        storage.delete(image.getFilePath());

        // Remove DB entry
        images.delete(image);
    }

    public Optional<AnalysisResult> getAnalysisForImage(Long imageId) {
        return Optional.ofNullable(analysisRepo.findByImageId(imageId));
    }
}
