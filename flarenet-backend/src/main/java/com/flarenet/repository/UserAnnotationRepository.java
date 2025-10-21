package com.flarenet.repository;

import com.flarenet.entity.UserAnnotation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserAnnotationRepository extends JpaRepository<UserAnnotation, Long> {
    Optional<UserAnnotation> findByThermalImageId(Long thermalImageId);
}
