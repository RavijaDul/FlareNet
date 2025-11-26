package com.flarenet.service;

import com.flarenet.entity.MaintenanceRecord;
import com.flarenet.entity.Inspection;
import com.flarenet.entity.Transformer;
import com.flarenet.repository.MaintenanceRecordRepository;
import com.flarenet.repository.InspectionRepository;
import com.flarenet.repository.TransformerRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Optional;

@Service
public class MaintenanceRecordService {

    @Autowired
    private MaintenanceRecordRepository maintenanceRecordRepository;

    @Autowired
    private InspectionRepository inspectionRepository;

    @Autowired
    private TransformerRepository transformerRepository;

    public MaintenanceRecord save(Long inspectionId, Long transformerId, String userId, String recordJson) {
        // If a maintenance record already exists for this inspection+transformer,
        // update it instead of inserting a new row (simple upsert behavior).
        if (inspectionId != null && transformerId != null) {
            try {
                java.util.List<MaintenanceRecord> existing = maintenanceRecordRepository.findByTransformerIdAndInspectionId(transformerId, inspectionId);
                if (existing != null && !existing.isEmpty()) {
                    MaintenanceRecord r = existing.get(0);
                    r.setUserId(userId);
                    r.setRecordJson(recordJson);
                    r.setUpdatedAt(java.time.Instant.now());
                    return maintenanceRecordRepository.save(r);
                }
            } catch (Exception e) {
                // if anything goes wrong querying existing records, fall back to creating a new one
            }
        }

        MaintenanceRecord r = new MaintenanceRecord();

        if (inspectionId != null) {
            Inspection insp = inspectionRepository.findById(inspectionId).orElse(null);
            r.setInspection(insp);
        }

        if (transformerId != null) {
            Transformer t = transformerRepository.findById(transformerId).orElse(null);
            r.setTransformer(t);
        }

        r.setUserId(userId);
        r.setRecordJson(recordJson);

        return maintenanceRecordRepository.save(r);
    }

    public List<MaintenanceRecord> findByInspection(Long inspectionId) {
        return maintenanceRecordRepository.findByInspectionId(inspectionId);
    }

    public List<MaintenanceRecord> findByTransformerAndInspection(Long transformerId, Long inspectionId) {
        return maintenanceRecordRepository.findByTransformerIdAndInspectionId(transformerId, inspectionId);
    }

    public Optional<MaintenanceRecord> findById(Long id) {
        return maintenanceRecordRepository.findById(id);
    }
}
