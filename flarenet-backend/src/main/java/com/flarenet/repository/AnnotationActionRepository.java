package com.flarenet.repository;

import com.flarenet.entity.AnnotationAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnotationActionRepository extends JpaRepository<AnnotationAction, Long> {
    List<AnnotationAction> findByUserAnnotationId(Long userAnnotationId);
    List<AnnotationAction> findByActionType(String actionType);
}
