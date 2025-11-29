package com.flarenet.controller;

import com.flarenet.entity.MaintenanceRecord;
import com.flarenet.service.MaintenanceRecordService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.servlet.http.HttpServletRequest;
import com.flarenet.security.JwtUtil;
import com.flarenet.model.Role;
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

    private final JwtUtil jwtUtil;

    public MaintenanceRecordController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    private static final Logger logger = LoggerFactory.getLogger(MaintenanceRecordController.class);

    // Save a new maintenance record for a given inspection
    @PostMapping("/api/inspections/{inspectionId}/maintenance-records")
    public ResponseEntity<?> saveForInspection(
            @PathVariable Long inspectionId,
            @RequestParam(value = "transformerId", required = false) Long transformerId,
            @RequestBody String recordJson,
            HttpServletRequest request
    ) {
        try {
            // Extract JWT from Authorization header and enforce role
            final String authHeader = request.getHeader("Authorization");
            String username = null;
            String role = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String jwt = authHeader.substring(7);
                try {
                    username = jwtUtil.extractUsername(jwt);
                    role = jwtUtil.extractRole(jwt);
                } catch (Exception e) {
                    // invalid token
                }
            }

            if (username == null) {
                Map<String, Object> err = new HashMap<>();
                err.put("error", "Unauthorized");
                err.put("message", "Missing or invalid token");
                return ResponseEntity.status(401).body(err);
            }

            // Only ENGINEERs may create/edit maintenance records
            if (!Role.ENGINEER.name().equalsIgnoreCase(role)) {
                Map<String, Object> err = new HashMap<>();
                err.put("error", "Forbidden");
                err.put("message", "Only users with role ENGINEER can add or edit maintenance records");
                return ResponseEntity.status(403).body(err);
            }

            MaintenanceRecord saved = service.save(inspectionId, transformerId, username, recordJson);
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
