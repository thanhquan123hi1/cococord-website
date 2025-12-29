package vn.cococord.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for message search results
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageSearchResponse {
    
    private String id;
    private Long channelId;
    private String channelName;
    private Long serverId;
    private String serverName;
    
    // Sender info
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    
    // Message content
    private String content;
    private String highlightedContent; // Content with highlighted search terms
    private String type;
    
    // Attachments summary
    private int attachmentCount;
    private List<AttachmentInfo> attachments;
    
    // Metadata
    private Float searchScore;
    private LocalDateTime createdAt;
    private Boolean isEdited;
    private LocalDateTime editedAt;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AttachmentInfo {
        private String fileName;
        private String fileType;
        private String fileUrl;
    }
}
