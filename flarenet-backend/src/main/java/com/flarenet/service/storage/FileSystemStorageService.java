package com.flarenet.service.storage;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;

@Service
public class FileSystemStorageService implements StorageService {
  private final Path root;

  public FileSystemStorageService(StorageProperties props) throws IOException {
    this.root = Path.of(props.getLocation()).toAbsolutePath().normalize();
    Files.createDirectories(this.root);
  }

  @Override
  public Path store(Long transformerId, MultipartFile file) {
    String cleanName = StringUtils.cleanPath(file.getOriginalFilename());
    Path dir = root.resolve("t-" + transformerId);
    try {
      Files.createDirectories(dir);
      Path target = dir.resolve(System.currentTimeMillis() + "-" + cleanName);
      Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
      return target;
    } catch (IOException e) {
      throw new RuntimeException("Failed to store file", e);
    }
  }
}
