//package com.flarenet.repository;
//
//import com.flarenet.entity.ThermalImage;
//import com.flarenet.entity.Transformer;
//import com.flarenet.entity.enums.ImageType;
//import com.flarenet.entity.enums.WeatherCondition;
//import org.springframework.data.jpa.repository.JpaRepository;
//import java.util.List;
//
//public interface ThermalImageRepository extends JpaRepository<ThermalImage, Long> {
//  List<ThermalImage> findByTransformerId(Long transformerId);
//  List<ThermalImage> findByTransformerAndImageType(Transformer t, ImageType type);
//  List<ThermalImage> findByTransformerAndImageTypeAndWeatherCondition(
//       Transformer t, ImageType type, WeatherCondition weather);
//}
// MultipleFiles/ThermalImageRepository.java
package com.flarenet.repository;

import com.flarenet.entity.ThermalImage;
import com.flarenet.entity.Transformer;
import com.flarenet.entity.Inspection; // Import Inspection
import com.flarenet.entity.enums.ImageType;
import com.flarenet.entity.enums.WeatherCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ThermalImageRepository extends JpaRepository<ThermalImage, Long> {
    List<ThermalImage> findByTransformerId(Long transformerId);
    List<ThermalImage> findByTransformerAndImageType(Transformer t, ImageType type);
    List<ThermalImage> findByTransformerAndImageTypeAndWeatherCondition(
            Transformer t, ImageType type, WeatherCondition weather);

    // --- NEW: Find images by Inspection and ImageType ---
    List<ThermalImage> findByInspectionAndImageType(Inspection inspection, ImageType imageType);
}
