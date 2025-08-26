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

    @Override // <--- Add this annotation and method implementation
    public void delete(String filePath) {
        try {
            Path fileToDelete = Paths.get(filePath);
            Files.deleteIfExists(fileToDelete); // Deletes the file if it exists
        } catch (IOException e) {
            // Log the error or throw a specific exception if deletion is critical
            System.err.println("Failed to delete file: " + filePath + " - " + e.getMessage());
            throw new RuntimeException("Failed to delete file: " + filePath, e);
        }
    }
}



//package com.flarenet.service.storage;
//
//import org.springframework.stereotype.Service;
//import org.springframework.util.StringUtils;
//import org.springframework.web.multipart.MultipartFile;
//
//import java.io.IOException;
//import java.nio.file.*;
//
//@Service
//public class FileSystemStorageService implements StorageService {
//  private final Path root;
//
//  public FileSystemStorageService(StorageProperties props) throws IOException {
//    this.root = Path.of(props.getLocation()).toAbsolutePath().normalize();
//    Files.createDirectories(this.root);
//  }
//
//  @Override
//  public Path store(Long transformerId, MultipartFile file) {
//    String cleanName = StringUtils.cleanPath(file.getOriginalFilename());
//    Path dir = root.resolve("t-" + transformerId);
//    try {
//      Files.createDirectories(dir);
//      Path target = dir.resolve(System.currentTimeMillis() + "-" + cleanName);
//      Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
//      return target;
//    } catch (IOException e) {
//      throw new RuntimeException("Failed to store file", e);
//    }
//  }
//}
// MultipleFiles/FileSystemStorageService.java
