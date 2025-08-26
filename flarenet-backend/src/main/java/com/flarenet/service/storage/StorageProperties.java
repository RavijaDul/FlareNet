package com.flarenet.service.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("flarenet.storage")
public class StorageProperties {
  private String location = "uploads";
  public String getLocation() { return location; }
  public void setLocation(String location) { this.location = location; }
}
