


// // MultipleFiles/ImageController.java

// package com.flarenet.controller;

// import com.flarenet.dto.ThermalImageResponse;
// import com.flarenet.entity.ThermalImage;
// import com.flarenet.entity.enums.ImageType;
// import com.flarenet.entity.enums.WeatherCondition;
// import com.flarenet.service.ThermalImageService;
// import org.springframework.core.io.Resource;
// import org.springframework.core.io.UrlResource;
// import org.springframework.http.HttpHeaders;
// import org.springframework.http.MediaType;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;
// import org.springframework.web.multipart.MultipartFile;
// import java.net.MalformedURLException;
// import java.nio.file.Path;
// import java.nio.file.Paths;
// import java.util.List;
// import java.util.Optional; // Import Optional

// @RestController
// @RequestMapping("/api/transformers/{transformerId}/images")
// @CrossOrigin(origins = "http://localhost:5173")
// public class ImageController {
//     private final ThermalImageService svc;
//     public ImageController(ThermalImageService svc){ this.svc = svc; }

//     @GetMapping
//     public List<ThermalImage> list(@PathVariable Long transformerId){
//         return svc.list(transformerId);
//     }

//     // --- NEW ENDPOINT: Get baseline image for a transformer ---
//     @GetMapping("/baseline")
//     public ResponseEntity<ThermalImageResponse> getBaselineImage(@PathVariable Long transformerId) {
//         Optional<ThermalImage> baselineImage = svc.getBaselineImageForTransformer(transformerId);
//         if (baselineImage.isPresent()) {
//             ThermalImage img = baselineImage.get();
//             ThermalImageResponse r = new ThermalImageResponse();
//             r.id = img.getId(); r.transformerId = img.getTransformer().getId();
//             r.imageType = img.getImageType(); r.weatherCondition = img.getWeatherCondition();
//             r.uploader = img.getUploader(); r.fileName = img.getFileName();
//             r.contentType = img.getContentType(); r.sizeBytes = img.getSizeBytes();
//             r.filePath = img.getFilePath(); r.uploadedAt = img.getUploadedAt();
//             r.url = "/api/transformers/" + transformerId + "/images/" + img.getId() + "/file";
//             return ResponseEntity.ok(r);
//         } else {
//             return ResponseEntity.notFound().build();
//         }
//     }

//     // --- NEW ENDPOINT: Get maintenance images for a specific inspection ---
//     @GetMapping("/inspection/{inspectionId}/maintenance")
//     public List<ThermalImageResponse> getMaintenanceImagesByInspection(
//             @PathVariable Long transformerId, @PathVariable Long inspectionId) {
//         return svc.getMaintenanceImagesForInspection(inspectionId).stream()
//                 .map(img -> {
//                     ThermalImageResponse r = new ThermalImageResponse();
//                     r.id = img.getId(); r.transformerId = img.getTransformer().getId();
//                     r.imageType = img.getImageType(); r.weatherCondition = img.getWeatherCondition();
//                     r.uploader = img.getUploader(); r.fileName = img.getFileName();
//                     r.contentType = img.getContentType(); r.sizeBytes = img.getSizeBytes();
//                     r.filePath = img.getFilePath(); r.uploadedAt = img.getUploadedAt();
//                     r.url = "/api/transformers/" + transformerId + "/images/" + img.getId() + "/file";
//                     return r;
//                 })
//                 .collect(java.util.stream.Collectors.toList());
//     }


//     @PostMapping(consumes = {"multipart/form-data"})
//     public ThermalImageResponse upload(@PathVariable Long transformerId,
//                                        @RequestParam("file") MultipartFile file,
//                                        @RequestParam("imageType") ImageType imageType,
//                                        @RequestParam(value="weatherCondition", required=false) WeatherCondition weather,
//                                        @RequestParam(value="uploader", required=false) String uploader,
//                                        @RequestParam(value="inspectionId", required=false) Long inspectionId) {

//         ThermalImage img = svc.upload(transformerId, file, imageType, weather, uploader, inspectionId);
//         ThermalImageResponse r = new ThermalImageResponse();
//         r.id = img.getId(); r.transformerId = img.getTransformer().getId();
//         r.imageType = img.getImageType(); r.weatherCondition = img.getWeatherCondition();
//         r.uploader = img.getUploader(); r.fileName = img.getFileName();
//         r.contentType = img.getContentType(); r.sizeBytes = img.getSizeBytes();
//         r.filePath = img.getFilePath(); r.uploadedAt = img.getUploadedAt();

//         // Generate URL for the image
//         r.url = "/api/transformers/" + transformerId + "/images/" + img.getId() + "/file";
//         return r;
//     }
//     // MultipleFiles/ImageController.java
//     @DeleteMapping("/baseline")
//     public ResponseEntity<Void> deleteBaselineImage(@PathVariable Long transformerId) {
//         svc.deleteBaselineImage(transformerId);
//         return ResponseEntity.noContent().build(); // Return 204 No Content on successful deletion
//     }

//     @GetMapping("/{imageId}/file")
//     public ResponseEntity<Resource> serveImage(@PathVariable Long transformerId, @PathVariable Long imageId) {
//         ThermalImage image = svc.getImageById(imageId);

//         try {
//             Path filePath = Paths.get(image.getFilePath());
//             Resource resource = new UrlResource(filePath.toUri());

//             if (resource.exists() && resource.isReadable()) {
//                 return ResponseEntity.ok()
//                         .contentType(MediaType.parseMediaType(image.getContentType()))
//                         .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + image.getFileName() + "\"")
//                         .body(resource);
//             } else {
//                 throw new RuntimeException("File not found or not readable");
//             }
//         } catch (MalformedURLException e) {
//             throw new RuntimeException("Error serving file", e);
//         }
//     }
// }
package com.flarenet.controller;

import com.flarenet.dto.ThermalImageResponse;
import com.flarenet.entity.AnalysisResult;
import com.flarenet.entity.ThermalImage;
import com.flarenet.entity.UserAnnotation;
import com.flarenet.entity.enums.ImageType;
import com.flarenet.entity.enums.WeatherCondition;
import com.flarenet.service.ThermalImageService;
import com.flarenet.service.UserAnnotationService;
import org.springframework.beans.factory.annotation.Autowired;
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
import java.util.*;

@RestController
@RequestMapping("/api/transformers/{transformerId}/images")
@CrossOrigin(origins = "http://localhost:5173")
public class ImageController {

    private final ThermalImageService svc;

    @Autowired
    private UserAnnotationService userAnnotationService;

    public ImageController(ThermalImageService svc){ this.svc = svc; }

    @GetMapping
    public List<ThermalImage> list(@PathVariable Long transformerId){
        return svc.list(transformerId);
    }

    // --- EXISTING FEATURE: Get baseline image ---
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

    // --- EXISTING FEATURE: Get maintenance images for an inspection ---
    // @GetMapping("/inspection/{inspectionId}/maintenance")
    // public List<ThermalImageResponse> getMaintenanceImagesByInspection(
    //         @PathVariable Long transformerId, @PathVariable Long inspectionId) {
    //     return svc.getMaintenanceImagesForInspection(inspectionId).stream()
    //             .map(img -> {
    //                 ThermalImageResponse r = new ThermalImageResponse();
    //                 r.id = img.getId(); r.transformerId = img.getTransformer().getId();
    //                 r.imageType = img.getImageType(); r.weatherCondition = img.getWeatherCondition();
    //                 r.uploader = img.getUploader(); r.fileName = img.getFileName();
    //                 r.contentType = img.getContentType(); r.sizeBytes = img.getSizeBytes();
    //                 r.filePath = img.getFilePath(); r.uploadedAt = img.getUploadedAt();
    //                 r.url = "/api/transformers/" + transformerId + "/images/" + img.getId() + "/file";
    //                 return r;
    //             })
    //             .collect(java.util.stream.Collectors.toList());
    // }
    @GetMapping("/inspection/{inspectionId}/maintenance")
    public List<ThermalImageResponse> getMaintenanceImagesByInspection(
            @PathVariable Long transformerId, @PathVariable Long inspectionId) {
        return svc.getMaintenanceImagesForInspection(inspectionId).stream()
                .map(img -> {
                    ThermalImageResponse r = new ThermalImageResponse();
                    r.id = img.getId();
                    r.transformerId = img.getTransformer().getId();
                    r.imageType = img.getImageType();
                    r.weatherCondition = img.getWeatherCondition();
                    r.uploader = img.getUploader();
                    r.fileName = img.getFileName();
                    r.contentType = img.getContentType();
                    r.sizeBytes = img.getSizeBytes();
                    r.filePath = img.getFilePath();
                    r.uploadedAt = img.getUploadedAt();
                    r.url = "/api/transformers/" + transformerId + "/images/" + img.getId() + "/file";

                    // ✅ Fetch user annotations first, fallback to AI analysis if no user annotations exist
                    Optional<UserAnnotation> userAnnotation = userAnnotationService.getAnnotationsForImage(img.getId());
                    if (userAnnotation.isPresent()) {
                        r.analysis = userAnnotation.get().getAnnotationsJson();
                    } else {
                        svc.getAnalysisForImage(img.getId())
                                .ifPresent(result -> r.analysis = result.getResultJson());
                    }

                    return r;
                })
                .collect(java.util.stream.Collectors.toList());
    }



    // --- UPDATED UPLOAD METHOD (Triggers Python Analysis if MAINTENANCE) ---
    @PostMapping(consumes = {"multipart/form-data"})
    public Map<String, Object> upload(
            @PathVariable Long transformerId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("imageType") ImageType imageType,
            @RequestParam(value="weatherCondition", required=false) WeatherCondition weather,
            @RequestParam(value="uploader", required=false) String uploader,
            @RequestParam(value="inspectionId", required=false) Long inspectionId) {

        // Save image to DB and filesystem
        ThermalImage img = svc.upload(transformerId, file, imageType, weather, uploader, inspectionId);

        // Build base response
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", img.getId());
        response.put("transformerId", img.getTransformer().getId());
        response.put("imageType", img.getImageType());
        response.put("uploader", img.getUploader());
        response.put("fileName", img.getFileName());
        response.put("uploadedAt", img.getUploadedAt());
        response.put("url", "/api/transformers/" + transformerId + "/images/" + img.getId() + "/file");

        // Include analysis JSON if MAINTENANCE
        if (img.getImageType() == ImageType.MAINTENANCE) {
            svc.getAnalysisForImage(img.getId())
                    .ifPresent(result -> response.put("analysis", result.getResultJson()));
        }

        return response;
    }

    // --- EXISTING FEATURE: Delete baseline image ---
    @DeleteMapping("/baseline")
    public ResponseEntity<Void> deleteBaselineImage(@PathVariable Long transformerId) {
        svc.deleteBaselineImage(transformerId);
        return ResponseEntity.noContent().build();
    }
    // --- NEW: Delete a specific maintenance image ---
    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> deleteMaintenanceImage(
            @PathVariable Long transformerId,
            @PathVariable Long imageId) {
        svc.deleteImageById(imageId);
        return ResponseEntity.noContent().build();
    }

    // --- EXISTING FEATURE: Serve stored image file ---
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
