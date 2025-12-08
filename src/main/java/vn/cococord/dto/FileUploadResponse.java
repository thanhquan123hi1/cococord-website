package vn.cococord.dto;

import lombok.Data;

@Data
public class FileUploadResponse {
    private String id;
    private String url;
    private String fileName;
    private String contentType;
    private long fileSize;
    private String thumbnailUrl;
}
