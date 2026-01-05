package vn.cococord.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageResponse {
    private String id;
    private Long channelId;
    private Long serverId;
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String content;
    private String type;
    private String parentMessageId;
    private String threadId;
    private String metadata; // Additional metadata (JSON string for stickers, etc.)
    private List<AttachmentResponse> attachments;
    private List<Long> mentionedUserIds;
    private Boolean isEdited;
    private LocalDateTime editedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachmentResponse {
        private String url;
        private String filename;
        private String contentType;
        private Long size;
    }
}
