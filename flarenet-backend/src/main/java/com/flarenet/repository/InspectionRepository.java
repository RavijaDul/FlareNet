//package com.flarenet.repository;
//
//import com.flarenet.entity.Inspection;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.data.jpa.repository.Query;
//import org.springframework.stereotype.Repository;
//import java.util.List;
//import java.util.Optional;
//
//@Repository
////public interface InspectionRepository extends JpaRepository<Inspection, Long> {
////  List<Inspection> findByTransformerIdOrderByInspectedDateDesc(Long transformerId);
////}
//
//public interface InspectionRepository extends JpaRepository<Inspection, Long> {
//    List<Inspection> findByTransformerIdOrderByInspectedDateDesc(Long transformerId);
//
//    @Query("SELECT MAX(i.id) FROM Inspection i")
//    Optional<Long> findMaxId();
//}
package com.flarenet.repository;
import java.util.List;
import java.util.Optional;

import com.flarenet.entity.Inspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface InspectionRepository extends JpaRepository<Inspection, Long> {

    List<Inspection> findByTransformerIdOrderByInspectedDateDesc(Long transformerId);

    // Find max inspectionNumber (stored as string, convert to number)
    @Query("SELECT MAX(CAST(i.inspectionNumber AS long)) FROM Inspection i")
    Optional<Long> findMaxInspectionNumber();
}
