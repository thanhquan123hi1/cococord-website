package vn.cococord.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.cococord.entity.mongodb.Message;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForumPostResponse {

    private String id;
    private Long channelId;
    private Long serverId;
    private Long authorId;
    private String authorUsername;
    private String authorDisplayName;
    private String authorAvatarUrl;
    private String title;
    private String imageUrl;
    private String content;
    private List<Message.Reaction> reactions;
    private Integer commentCount;
    private Boolean isPinned;
    private Boolean isLocked;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
