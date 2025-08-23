package com.flarenet.service.storage;

import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Path;

public interface StorageService {
  Path store(Long transformerId, MultipartFile file);
}
