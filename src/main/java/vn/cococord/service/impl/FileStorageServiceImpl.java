package vn.cococord.service.impl;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import vn.cococord.dto.response.FileUploadResponse;
import vn.cococord.exception.BadRequestException;
import vn.cococord.service.IFileStorageService;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class FileStorageServiceImpl implements IFileStorageService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.upload.max-file-size:8388608}") // 8MB default
    private long maxFileSize;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );

    private static final List<String> ALLOWED_VIDEO_TYPES = Arrays.asList(
            "video/mp4", "video/webm", "video/ogg"
    );

    private static final List<String> ALLOWED_DOCUMENT_TYPES = Arrays.asList(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain"
    );

    @Override
    public FileUploadResponse uploadFile(MultipartFile file, String uploadedBy) {
        validateFile(file);

        try {
            // Create directory structure: uploads/YYYY/MM/DD
            LocalDate today = LocalDate.now();
            Path uploadPath = Paths.get(uploadDir, 
                String.valueOf(today.getYear()),
                String.format("%02d", today.getMonthValue()),
                String.format("%02d", today.getDayOfMonth())
            );
            Files.createDirectories(uploadPath);

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : "";
            String fileId = UUID.randomUUID().toString();
            String filename = fileId + extension;
            
            // Save original file
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Build file URL
            String fileUrl = String.format("%s/uploads/%d/%02d/%02d/%s", 
                baseUrl, today.getYear(), today.getMonthValue(), today.getDayOfMonth(), filename);

            FileUploadResponse response = FileUploadResponse.builder()
                    .fileId(fileId)
                    .fileName(originalFilename)
                    .fileUrl(fileUrl)
                    .mimeType(file.getContentType())
                    .fileSize(file.getSize())
                    .build();

            // Generate thumbnail for images
            if (ALLOWED_IMAGE_TYPES.contains(file.getContentType())) {
                try {
                    BufferedImage originalImage = ImageIO.read(filePath.toFile());
                    if (originalImage != null) {
                        response.setWidth(originalImage.getWidth());
                        response.setHeight(originalImage.getHeight());

                        // Generate thumbnail (256x256)
                        String thumbnailFilename = fileId + "_thumb" + extension;
                        Path thumbnailPath = uploadPath.resolve(thumbnailFilename);
                        
                        Thumbnails.of(filePath.toFile())
                                .size(256, 256)
                                .toFile(thumbnailPath.toFile());

                        String thumbnailUrl = String.format("%s/uploads/%d/%02d/%02d/%s", 
                            baseUrl, today.getYear(), today.getMonthValue(), today.getDayOfMonth(), thumbnailFilename);
                        response.setThumbnailUrl(thumbnailUrl);
                    }
                } catch (Exception e) {
                    log.warn("Failed to generate thumbnail for file: {}", filename, e);
                }
            }

            log.info("File uploaded successfully: {} by user: {}", filename, uploadedBy);
            return response;

        } catch (IOException e) {
            log.error("Failed to upload file", e);
            throw new BadRequestException("Failed to upload file: " + e.getMessage());
        }
    }

    @Override
    public void deleteFile(String fileId) {
        // Implementation for deleting files
        // Search for file by ID and delete it
        try {
            Path uploadPath = Paths.get(uploadDir);
            Files.walk(uploadPath)
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().startsWith(fileId))
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                            log.info("Deleted file: {}", path);
                        } catch (IOException e) {
                            log.error("Failed to delete file: {}", path, e);
                        }
                    });
        } catch (IOException e) {
            log.error("Failed to delete file with ID: {}", fileId, e);
        }
    }

    @Override
    public void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }

        if (file.getSize() > maxFileSize) {
            throw new BadRequestException(
                String.format("File size exceeds maximum allowed size of %d MB", maxFileSize / (1024 * 1024))
            );
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            throw new BadRequestException("File type is unknown");
        }

        boolean isAllowed = ALLOWED_IMAGE_TYPES.contains(contentType) ||
                           ALLOWED_VIDEO_TYPES.contains(contentType) ||
                           ALLOWED_DOCUMENT_TYPES.contains(contentType);

        if (!isAllowed) {
            throw new BadRequestException("File type not allowed: " + contentType);
        }

        // Check filename for malicious content
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && (originalFilename.contains("..") || originalFilename.contains("/"))) {
            throw new BadRequestException("Invalid filename");
        }
    }
}
