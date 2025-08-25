package com.flarenet.repository;

import com.flarenet.entity.Inspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InspectionRepository extends JpaRepository<Inspection, Long> {
  List<Inspection> findByTransformerIdOrderByInspectedDateDesc(Long transformerId);
}

