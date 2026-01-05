package vn.cococord.entity.mongodb;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.TextScore;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "messages")
@CompoundIndexes({
    @CompoundIndex(def = "{'channelId': 1, 'createdAt': -1}"),
    @CompoundIndex(def = "{'serverId': 1, 'createdAt': -1}")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    private String id;

    @Indexed
    private Long channelId; // Reference to MySQL Channel ID

    @Indexed
    private Long serverId; // Reference to MySQL Server ID

    @Indexed
    private Long userId; // Reference to MySQL User ID

    private String username;

    private String displayName;

    private String avatarUrl;

    @TextIndexed(weight = 2) // Text index for full-text search with higher weight
    private String content;

    @TextScore
    private Float score; // Score from text search, not persisted

    @Builder.Default
    private MessageType type = MessageType.TEXT;

    // For reply/thread
    private String parentMessageId;

    private String threadId;

    // Metadata (for stickers, etc.)
    private String metadata;

    // Attachments (images, files, videos)
    @Builder.Default
    private List<Attachment> attachments = new ArrayList<>();

    // Embeds (links preview, rich content)
    @Builder.Default
    private List<Embed> embeds = new ArrayList<>();

    // Mentions
    @Builder.Default
    private List<Long> mentionedUserIds = new ArrayList<>();

    @Builder.Default
    private List<Long> mentionedRoleIds = new ArrayList<>();

    @Builder.Default
    private Boolean mentionEveryone = false;

    // Reactions
    @Builder.Default
    private List<Reaction> reactions = new ArrayList<>();

    // Edit history
    @Builder.Default
    private Boolean isEdited = false;

    private LocalDateTime editedAt;

    @Builder.Default
    private List<EditHistory> editHistory = new ArrayList<>();

    // Deletion
    @Builder.Default
    private Boolean isDeleted = false;

    private LocalDateTime deletedAt;

    private Long deletedBy;

    // Pinned
    @Builder.Default
    private Boolean isPinned = false;

    private LocalDateTime pinnedAt;

    private Long pinnedBy;

    // Timestamps
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum MessageType {
        TEXT,
        IMAGE,
        FILE,
        AUDIO,
        VIDEO,
        STICKER,
        SYSTEM, // System messages (user joined, left, etc.)
        ANNOUNCEMENT
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Attachment {
        private String id;
        private String fileName;
        private String fileUrl;
        private String fileType; // MIME type
        private Long fileSize;
        private String thumbnailUrl;
        private Integer width;
        private Integer height;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Embed {
        private String title;
        private String description;
        private String url;
        private String color;
        private String thumbnailUrl;
        private String imageUrl;
        private LocalDateTime timestamp;
        private EmbedAuthor author;
        private List<EmbedField> fields;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmbedAuthor {
        private String name;
        private String url;
        private String iconUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmbedField {
        private String name;
        private String value;
        private Boolean inline;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Reaction {
        private String emoji;
        private String emojiId; // For custom emojis
        @Builder.Default
        private Set<Long> userIds = new HashSet<>();
        private Integer count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EditHistory {
        private String oldContent;
        private LocalDateTime editedAt;
    }
}
