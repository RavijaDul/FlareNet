package com.flarenet.repository;

import com.flarenet.entity.Detection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetectionRepository extends JpaRepository<Detection, Long> {
    List<Detection> findByAnalysisResultId(Long analysisResultId);
    List<Detection> findByCategory(String category);
    List<Detection> findBySeverity(String severity);
}
