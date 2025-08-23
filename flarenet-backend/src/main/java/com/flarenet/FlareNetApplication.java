package com.flarenet;

import com.flarenet.service.storage.StorageProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(StorageProperties.class)
public class FlareNetApplication {
  public static void main(String[] args) {
    SpringApplication.run(FlareNetApplication.class, args);
  }
}
