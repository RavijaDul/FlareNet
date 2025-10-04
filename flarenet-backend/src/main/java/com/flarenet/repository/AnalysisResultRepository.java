package com.flarenet.repository;

import com.flarenet.entity.AnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnalysisResultRepository extends JpaRepository<AnalysisResult, Long> {
    AnalysisResult findByImageId(Long imageId);
}
