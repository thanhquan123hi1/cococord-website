package vn.cococord.service;

import org.springframework.web.multipart.MultipartFile;

import vn.cococord.dto.response.FileUploadResponse;

public interface IFileStorageService {

    /**
     * Upload a file and return file metadata
     */
    FileUploadResponse uploadFile(MultipartFile file, String uploadedBy);

    /**
     * Delete a file by file ID
     */
    void deleteFile(String fileId);

    /**
     * Validate file before upload
     */
    void validateFile(MultipartFile file);
}
