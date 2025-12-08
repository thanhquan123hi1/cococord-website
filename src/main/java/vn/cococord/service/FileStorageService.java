package vn.cococord.service;

import vn.cococord.dto.FileUploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.upload.max-size:26214400}") // 25MB default
    private long maxFileSize;

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/gif", "image/webp");

    private static final List<String> ALLOWED_VIDEO_TYPES = Arrays.asList(
            "video/mp4", "video/webm", "video/quicktime");

    private static final List<String> ALLOWED_DOCUMENT_TYPES = Arrays.asList(
            "application/pdf", "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain", "application/zip", "application/x-rar-compressed");

    public FileUploadResponse uploadFile(MultipartFile file, Long userId) throws IOException {
        // Validate file size
        if (file.getSize() > maxFileSize) {
            throw new RuntimeException("File size exceeds maximum allowed size of 25MB");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (!isAllowedType(contentType)) {
            throw new RuntimeException("File type not allowed");
        }

        // Create upload directory if not exists
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex);
        }
        String uniqueFilename = UUID.randomUUID().toString() + extension;

        // Save file
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Create response
        FileUploadResponse response = new FileUploadResponse();
        response.setId(UUID.randomUUID().toString());
        response.setUrl("/uploads/" + uniqueFilename);
        response.setFileName(originalFilename);
        response.setContentType(contentType);
        response.setFileSize(file.getSize());

        // Generate thumbnail for images
        if (isImageType(contentType)) {
            response.setThumbnailUrl(response.getUrl()); // Same URL for now
        }

        return response;
    }

    public void deleteFile(String filename) throws IOException {
        Path filePath = Paths.get(uploadDir).resolve(filename);
        Files.deleteIfExists(filePath);
    }

    public Path getFilePath(String filename) {
        return Paths.get(uploadDir).resolve(filename);
    }

    private boolean isAllowedType(String contentType) {
        return ALLOWED_IMAGE_TYPES.contains(contentType) ||
                ALLOWED_VIDEO_TYPES.contains(contentType) ||
                ALLOWED_DOCUMENT_TYPES.contains(contentType);
    }

    public boolean isImageType(String contentType) {
        return ALLOWED_IMAGE_TYPES.contains(contentType);
    }

    public boolean isVideoType(String contentType) {
        return ALLOWED_VIDEO_TYPES.contains(contentType);
    }
}
