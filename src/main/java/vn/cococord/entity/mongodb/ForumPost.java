package vn.cococord.entity.mongodb;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ForumPost entity for FORUM channel type posts
 * Posts appear as tree branches under the forum channel
 */
@Document(collection = "forum_posts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForumPost {

    @Id
    private String id;

    @Indexed
    private Long channelId;

    @Indexed
    private Long serverId;

    @Indexed
    private Long authorId;

    private String authorUsername;

    private String authorDisplayName;

    private String authorAvatarUrl;

    /**
     * Post title - max 25 characters
     */
    private String title;

    /**
     * Image URL - required for posting
     */
    private String imageUrl;

    /**
     * Optional description/content
     */
    private String content;

    /**
     * Reactions on this post
     */
    @Builder.Default
    private List<Message.Reaction> reactions = new ArrayList<>();

    /**
     * Number of comments/replies
     */
    @Builder.Default
    private Integer commentCount = 0;

    /**
     * Is post pinned to top
     */
    @Builder.Default
    private Boolean isPinned = false;

    /**
     * Is post locked (no new comments)
     */
    @Builder.Default
    private Boolean isLocked = false;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
