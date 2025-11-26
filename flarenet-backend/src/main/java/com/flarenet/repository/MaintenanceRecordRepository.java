package com.flarenet.repository;

import com.flarenet.entity.MaintenanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, Long> {
    List<MaintenanceRecord> findByInspectionId(Long inspectionId);
    List<MaintenanceRecord> findByTransformerIdAndInspectionId(Long transformerId, Long inspectionId);
}
