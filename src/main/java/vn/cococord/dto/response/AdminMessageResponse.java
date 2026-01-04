package vn.cococord.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminMessageResponse {

    private String id;
    private String content;
    private String type;

    // Author info
    private Long authorId;
    private String authorUsername;
    private String authorAvatarUrl;

    // Channel/Server info
    private Long channelId;
    private String channelName;
    private Long serverId;
    private String serverName;

    // Moderation info
    private boolean isReported;
    private int reportCount;
    private boolean isDeleted;
    private LocalDateTime deletedAt;
    private String deletedBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
