package com.flarenet.repository;

import com.flarenet.entity.Transformer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TransformerRepository extends JpaRepository<Transformer, Long> {
  Optional<Transformer> findByTransformerNo(String transformerNo);
}
