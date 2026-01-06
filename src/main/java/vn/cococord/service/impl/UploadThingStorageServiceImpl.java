package vn.cococord.service.impl;

import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.response.FileUploadResponse;
import vn.cococord.exception.BadRequestException;
import vn.cococord.service.IFileStorageService;

/**
 * Cloudinary Storage Service - Upload file lên Cloudinary cloud storage
 * Free tier: 25GB storage, 25GB bandwidth/month
 * 
 * Đăng ký tại: https://cloudinary.com/
 * Lấy credentials từ Dashboard -> Settings -> Access Keys
 */
@Service
@Primary
@RequiredArgsConstructor
@Slf4j
public class UploadThingStorageServiceImpl implements IFileStorageService {

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    private final RestClient.Builder restClientBuilder;

    @Override
    public FileUploadResponse uploadFile(MultipartFile file, String uploadedBy) {
        validateFile(file);
        validateCloudinaryConfig();

        try {
            RestClient restClient = restClientBuilder.build();

            // Xác định resource_type dựa trên loại file
            String resourceType = determineResourceType(file.getContentType());
            String uploadUrl = String.format("https://api.cloudinary.com/v1_1/%s/%s/upload", cloudName, resourceType);

            // Tạo public_id unique
            String publicId = "cococord/" + UUID.randomUUID().toString();

            // Tạo timestamp
            long timestamp = System.currentTimeMillis() / 1000;
            
            // Build parameters for signature (KHÔNG bao gồm file, api_key, signature)
            Map<String, String> signParams = new java.util.TreeMap<>(); // TreeMap tự động sort theo alphabet
            signParams.put("public_id", publicId);
            signParams.put("timestamp", String.valueOf(timestamp));
            
            // Generate signature với tất cả parameters
            String signature = generateSignature(signParams);

            // Build multipart form data
            MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();
            formData.add("file", file.getResource());
            formData.add("public_id", publicId);
            formData.add("timestamp", String.valueOf(timestamp));
            formData.add("api_key", apiKey);
            formData.add("signature", signature);

            log.info("Đang upload file lên Cloudinary: {} ({})", file.getOriginalFilename(), resourceType);

            // Upload lên Cloudinary
            CloudinaryResponse response = restClient.post()
                    .uri(uploadUrl)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(formData)
                    .retrieve()
                    .body(CloudinaryResponse.class);

            if (response == null || response.getSecureUrl() == null) {
                throw new BadRequestException("Cloudinary API trả về rỗng.");
            }

            log.info("Upload thành công. File URL: {}", response.getSecureUrl());
            
            // Transform URL để force inline display (không tự động download)
            String displayUrl = transformUrlForInlineDisplay(response.getSecureUrl(), resourceType);

            return FileUploadResponse.builder()
                    .fileId(response.getPublicId())
                    .fileName(file.getOriginalFilename())
                    .fileUrl(displayUrl)
                    .mimeType(file.getContentType())
                    .fileSize(file.getSize())
                    .thumbnailUrl(generateThumbnailUrl(displayUrl, resourceType))
                    .build();

        } catch (Exception e) {
            log.error("Lỗi Cloudinary: {}", e.getMessage(), e);
            
            if (e.getMessage() != null && e.getMessage().contains("401")) {
                throw new BadRequestException("Lỗi xác thực Cloudinary. Kiểm tra API Key và Secret.");
            }
            throw new BadRequestException("Không thể upload file: " + e.getMessage());
        }
    }

    @Override
    public void deleteFile(String publicId) {
        if (publicId == null || publicId.isEmpty()) return;
        
        validateCloudinaryConfig();

        try {
            RestClient restClient = restClientBuilder.build();

            long timestamp = System.currentTimeMillis() / 1000;
            
            Map<String, String> signParams = new java.util.TreeMap<>();
            signParams.put("public_id", publicId);
            signParams.put("timestamp", String.valueOf(timestamp));
            
            String signature = generateSignature(signParams);

            String deleteUrl = String.format("https://api.cloudinary.com/v1_1/%s/image/destroy", cloudName);

            MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
            formData.add("public_id", publicId);
            formData.add("timestamp", String.valueOf(timestamp));
            formData.add("api_key", apiKey);
            formData.add("signature", signature);

            restClient.post()
                    .uri(deleteUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Đã xóa file trên Cloudinary: {}", publicId);
        } catch (Exception e) {
            log.error("Lỗi xóa file Cloudinary: {}", e.getMessage());
        }
    }

    @Override
    public void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File không được rỗng");
        }
        
        // Cloudinary free tier giới hạn 10MB cho image, 100MB cho video
        long maxSize = 100 * 1024 * 1024; // 100MB
        if (file.getSize() > maxSize) {
            throw new BadRequestException("File quá lớn. Tối đa 100MB.");
        }
    }

    private void validateCloudinaryConfig() {
        if (cloudName == null || cloudName.isEmpty() ||
            apiKey == null || apiKey.isEmpty() ||
            apiSecret == null || apiSecret.isEmpty()) {
            throw new BadRequestException(
                "Cloudinary chưa được cấu hình. Thêm cloudinary.cloud-name, cloudinary.api-key, cloudinary.api-secret vào application.properties"
            );
        }
    }

    private String determineResourceType(String contentType) {
        if (contentType == null) return "auto";
        if (contentType.startsWith("image/")) return "image";
        if (contentType.startsWith("video/")) return "video";
        return "raw"; // Cho PDF, documents, etc.
    }

    /**
     * Generate Cloudinary signature
     * Cloudinary yêu cầu signature theo format:
     * 1. Lấy tất cả parameters cần sign (KHÔNG bao gồm file, api_key, signature)
     * 2. Sắp xếp theo thứ tự alphabet
     * 3. Format: param1=value1&param2=value2&...&api_secret
     * 4. SHA-1 hash
     */
    private String generateSignature(Map<String, String> params) {
        try {
            // Build string to sign: param1=value1&param2=value2...
            StringBuilder toSign = new StringBuilder();
            for (Map.Entry<String, String> entry : params.entrySet()) {
                if (toSign.length() > 0) {
                    toSign.append("&");
                }
                toSign.append(entry.getKey()).append("=").append(entry.getValue());
            }
            // Append API secret at the end
            toSign.append(apiSecret);
            
            log.debug("String to sign: {}", toSign.toString());
            
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(toSign.toString().getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Không thể tạo signature", e);
        }
    }

    private String generateThumbnailUrl(String url, String resourceType) {
        if (url == null) return null;
        
        // Với image, tạo thumbnail 200x200
        if ("image".equals(resourceType) && url.contains("/upload/")) {
            return url.replace("/upload/", "/upload/c_thumb,w_200,h_200/");
        }
        
        // Với video, lấy frame đầu tiên làm thumbnail
        if ("video".equals(resourceType) && url.contains("/upload/")) {
            return url.replace("/upload/", "/upload/c_thumb,w_200,h_200/")
                      .replaceAll("\\.[^.]+$", ".jpg");
        }
        
        return url;
    }

    /**
     * Transform URL để force inline display thay vì download
     * Thêm transformation flags để Cloudinary serve file với Content-Disposition: inline
     */
    private String transformUrlForInlineDisplay(String url, String resourceType) {
        if (url == null || !url.contains("/upload/")) return url;
        
        // Đối với raw files (PDF, documents), thêm fl_attachment flag để control behavior
        // Cloudinary mặc định sẽ set Content-Disposition dựa trên resource type
        // Với images và videos, không cần transform vì đã inline by default
        if ("raw".equals(resourceType)) {
            // Thêm fl_attachment:false để force inline display
            return url.replace("/upload/", "/upload/fl_attachment:false/");
        }
        
        return url;
    }

    @Data
    static class CloudinaryResponse {
        @JsonProperty("public_id")
        private String publicId;
        
        @JsonProperty("secure_url")
        private String secureUrl;
        
        private String url;
        private String format;
        
        @JsonProperty("resource_type")
        private String resourceType;
        
        private Integer width;
        private Integer height;
        private Long bytes;
    }
}