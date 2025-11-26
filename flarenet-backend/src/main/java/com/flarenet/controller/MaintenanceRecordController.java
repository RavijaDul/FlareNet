package com.flarenet.controller;

import com.flarenet.entity.MaintenanceRecord;
import com.flarenet.service.MaintenanceRecordService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class MaintenanceRecordController {

    @Autowired
    private MaintenanceRecordService service;

    private static final Logger logger = LoggerFactory.getLogger(MaintenanceRecordController.class);

    // Save a new maintenance record for a given inspection
    @PostMapping("/api/inspections/{inspectionId}/maintenance-records")
    public ResponseEntity<?> saveForInspection(
            @PathVariable Long inspectionId,
            @RequestParam(value = "transformerId", required = false) Long transformerId,
            @RequestParam(value = "userId", required = false, defaultValue = "user") String userId,
            @RequestBody String recordJson
    ) {
        try {
            MaintenanceRecord saved = service.save(inspectionId, transformerId, userId, recordJson);
            // Return a minimal payload to avoid Jackson serializing lazy-loaded entities
            Map<String, Object> result = new HashMap<>();
            result.put("id", saved.getId());
            result.put("inspectionId", saved.getInspection() != null ? saved.getInspection().getId() : null);
            result.put("transformerId", saved.getTransformer() != null ? saved.getTransformer().getId() : null);
            result.put("userId", saved.getUserId());
            result.put("recordJson", saved.getRecordJson());
            result.put("createdAt", saved.getCreatedAt());
            result.put("updatedAt", saved.getUpdatedAt());
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            // Log stacktrace and return a helpful error payload to caller
            logger.error("Error saving maintenance record for inspection {} transformer {}: {}", inspectionId, transformerId, ex.getMessage(), ex);
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Failed to save maintenance record");
            err.put("message", ex.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }

    // Retrieve records for an inspection
    @GetMapping("/api/inspections/{inspectionId}/maintenance-records")
    public ResponseEntity<?> listForInspection(@PathVariable Long inspectionId) {
        try {
            List<MaintenanceRecord> list = service.findByInspection(inspectionId);
            List<Map<String, Object>> out = new java.util.ArrayList<>();
            for (MaintenanceRecord r : list) {
                Map<String, Object> m = new HashMap<>();
                m.put("id", r.getId());
                m.put("inspectionId", r.getInspection() != null ? r.getInspection().getId() : null);
                m.put("transformerId", r.getTransformer() != null ? r.getTransformer().getId() : null);
                m.put("userId", r.getUserId());
                m.put("recordJson", r.getRecordJson());
                m.put("createdAt", r.getCreatedAt());
                m.put("updatedAt", r.getUpdatedAt());
                out.add(m);
            }
            return ResponseEntity.ok(out);
        } catch (Exception ex) {
            logger.error("Error listing maintenance records for inspection {}: {}", inspectionId, ex.getMessage(), ex);
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Failed to list maintenance records");
            err.put("message", ex.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }

    // Retrieve records for a transformer + inspection
    @GetMapping("/api/transformers/{transformerId}/inspections/{inspectionId}/maintenance-records")
    public ResponseEntity<?> listForTransformerInspection(
            @PathVariable Long transformerId, @PathVariable Long inspectionId) {
        try {
            List<MaintenanceRecord> list = service.findByTransformerAndInspection(transformerId, inspectionId);
            List<Map<String, Object>> out = new java.util.ArrayList<>();
            for (MaintenanceRecord r : list) {
                Map<String, Object> m = new HashMap<>();
                m.put("id", r.getId());
                m.put("inspectionId", r.getInspection() != null ? r.getInspection().getId() : null);
                m.put("transformerId", r.getTransformer() != null ? r.getTransformer().getId() : null);
                m.put("userId", r.getUserId());
                m.put("recordJson", r.getRecordJson());
                m.put("createdAt", r.getCreatedAt());
                m.put("updatedAt", r.getUpdatedAt());
                out.add(m);
            }
            return ResponseEntity.ok(out);
        } catch (Exception ex) {
            logger.error("Error listing maintenance records for transformer {} inspection {}: {}", transformerId, inspectionId, ex.getMessage(), ex);
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Failed to list maintenance records");
            err.put("message", ex.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }
}
