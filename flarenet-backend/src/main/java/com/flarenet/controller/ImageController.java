//package com.flarenet.controller;
//
//import com.flarenet.dto.ThermalImageResponse;
//import com.flarenet.entity.ThermalImage;
//import com.flarenet.entity.enums.ImageType;
//import com.flarenet.entity.enums.WeatherCondition;
//import com.flarenet.service.ThermalImageService;
//import org.springframework.core.io.Resource;
//import org.springframework.core.io.UrlResource;
//import org.springframework.http.HttpHeaders;
//import org.springframework.http.MediaType;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//import org.springframework.web.multipart.MultipartFile;
//import java.net.MalformedURLException;
//import java.nio.file.Path;
//import java.nio.file.Paths;
//import java.util.List;
//
//@RestController
//@RequestMapping("/api/transformers/{transformerId}/images")
//@CrossOrigin(origins = "http://localhost:5173")
//public class ImageController {
//  private final ThermalImageService svc;
//  public ImageController(ThermalImageService svc){ this.svc = svc; }
//
//  @GetMapping
//  public List<ThermalImage> list(@PathVariable Long transformerId){
//    return svc.list(transformerId);
//  }
//
//  @PostMapping(consumes = {"multipart/form-data"})
//  public ThermalImageResponse upload(@PathVariable Long transformerId,
//    @RequestParam("file") MultipartFile file,
//    @RequestParam("imageType") ImageType imageType,
//    @RequestParam(value="weatherCondition", required=false) WeatherCondition weather,
//    @RequestParam(value="uploader", required=false) String uploader,
//    @RequestParam(value="inspectionId", required=false) Long inspectionId) {
//
//    ThermalImage img = svc.upload(transformerId, file, imageType, weather, uploader, inspectionId);
//    ThermalImageResponse r = new ThermalImageResponse();
//    r.id = img.getId(); r.transformerId = img.getTransformer().getId();
//    r.imageType = img.getImageType(); r.weatherCondition = img.getWeatherCondition();
//    r.uploader = img.getUploader(); r.fileName = img.getFileName();
//    r.contentType = img.getContentType(); r.sizeBytes = img.getSizeBytes();
//    r.filePath = img.getFilePath(); r.uploadedAt = img.getUploadedAt();
//
//    // Generate URL for the image
//    r.url = "/api/transformers/" + transformerId + "/images/" + img.getId() + "/file";
//    return r;
//  }
//
//  @GetMapping("/{imageId}/file")
//  public ResponseEntity<Resource> serveImage(@PathVariable Long transformerId, @PathVariable Long imageId) {
//    ThermalImage image = svc.getImageById(imageId);
//
//    try {
//      Path filePath = Paths.get(image.getFilePath());
//      Resource resource = new UrlResource(filePath.toUri());
//
//      if (resource.exists() && resource.isReadable()) {
//        return ResponseEntity.ok()
//            .contentType(MediaType.parseMediaType(image.getContentType()))
//            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + image.getFileName() + "\"")
//            .body(resource);
//      } else {
//        throw new RuntimeException("File not found or not readable");
//      }
//    } catch (MalformedURLException e) {
//      throw new RuntimeException("Error serving file", e);
//    }
//  }
//}
// MultipleFiles/ImageController.java
package com.flarenet.controller;

import com.flarenet.dto.ThermalImageResponse;
import com.flarenet.entity.ThermalImage;
import com.flarenet.entity.enums.ImageType;
import com.flarenet.entity.enums.WeatherCondition;
import com.flarenet.service.ThermalImageService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional; // Import Optional

@RestController
@RequestMapping("/api/transformers/{transformerId}/images")
@CrossOrigin(origins = "http://localhost:5173")
public class ImageController {
    private final ThermalImageService svc;
    public ImageController(ThermalImageService svc){ this.svc = svc; }

    @GetMapping
    public List<ThermalImage> list(@PathVariable Long transformerId){
        return svc.list(transformerId);
    }

    // --- NEW ENDPOINT: Get baseline image for a transformer ---
    @GetMapping("/baseline")
    public ResponseEntity<ThermalImageResponse> getBaselineImage(@PathVariable Long transformerId) {
        Optional<ThermalImage> baselineImage = svc.getBaselineImageForTransformer(transformerId);
        if (baselineImage.isPresent()) {
            ThermalImage img = baselineImage.get();
            ThermalImageResponse r = new ThermalImageResponse();
            r.id = img.getId(); r.transformerId = img.getTransformer().getId();
            r.imageType = img.getImageType(); r.weatherCondition = img.getWeatherCondition();
            r.uploader = img.getUploader(); r.fileName = img.getFileName();
            r.contentType = img.getContentType(); r.sizeBytes = img.getSizeBytes();
            r.filePath = img.getFilePath(); r.uploadedAt = img.getUploadedAt();
            r.url = "/api/transformers/" + transformerId + "/images/" + img.getId() + "/file";
            return ResponseEntity.ok(r);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // --- NEW ENDPOINT: Get maintenance images for a specific inspection ---
    @GetMapping("/inspection/{inspectionId}/maintenance")
    public List<ThermalImageResponse> getMaintenanceImagesByInspection(
            @PathVariable Long transformerId, @PathVariable Long inspectionId) {
        return svc.getMaintenanceImagesForInspection(inspectionId).stream()
                .map(img -> {
                    ThermalImageResponse r = new ThermalImageResponse();
                    r.id = img.getId(); r.transformerId = img.getTransformer().getId();
                    r.imageType = img.getImageType(); r.weatherCondition = img.getWeatherCondition();
                    r.uploader = img.getUploader(); r.fileName = img.getFileName();
                    r.contentType = img.getContentType(); r.sizeBytes = img.getSizeBytes();
                    r.filePath = img.getFilePath(); r.uploadedAt = img.getUploadedAt();
                    r.url = "/api/transformers/" + transformerId + "/images/" + img.getId() + "/file";
                    return r;
                })
                .collect(java.util.stream.Collectors.toList());
    }


    @PostMapping(consumes = {"multipart/form-data"})
    public ThermalImageResponse upload(@PathVariable Long transformerId,
                                       @RequestParam("file") MultipartFile file,
                                       @RequestParam("imageType") ImageType imageType,
                                       @RequestParam(value="weatherCondition", required=false) WeatherCondition weather,
                                       @RequestParam(value="uploader", required=false) String uploader,
                                       @RequestParam(value="inspectionId", required=false) Long inspectionId) {

        ThermalImage img = svc.upload(transformerId, file, imageType, weather, uploader, inspectionId);
        ThermalImageResponse r = new ThermalImageResponse();
        r.id = img.getId(); r.transformerId = img.getTransformer().getId();
        r.imageType = img.getImageType(); r.weatherCondition = img.getWeatherCondition();
        r.uploader = img.getUploader(); r.fileName = img.getFileName();
        r.contentType = img.getContentType(); r.sizeBytes = img.getSizeBytes();
        r.filePath = img.getFilePath(); r.uploadedAt = img.getUploadedAt();

        // Generate URL for the image
        r.url = "/api/transformers/" + transformerId + "/images/" + img.getId() + "/file";
        return r;
    }
    // MultipleFiles/ImageController.java
    @DeleteMapping("/baseline")
    public ResponseEntity<Void> deleteBaselineImage(@PathVariable Long transformerId) {
        svc.deleteBaselineImage(transformerId);
        return ResponseEntity.noContent().build(); // Return 204 No Content on successful deletion
    }

    @GetMapping("/{imageId}/file")
    public ResponseEntity<Resource> serveImage(@PathVariable Long transformerId, @PathVariable Long imageId) {
        ThermalImage image = svc.getImageById(imageId);

        try {
            Path filePath = Paths.get(image.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(image.getContentType()))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + image.getFileName() + "\"")
                        .body(resource);
            } else {
                throw new RuntimeException("File not found or not readable");
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error serving file", e);
        }
    }
}
