package vn.cococord.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for file attachments in messages
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttachmentRequest {
    
    private String fileName;
    
    private String fileUrl;
    
    private String fileType; // MIME type
    
    private Long fileSize;
}
