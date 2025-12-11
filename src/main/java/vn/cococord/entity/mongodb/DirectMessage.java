package vn.cococord.entity.mongodb;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Document(collection = "direct_messages")
@CompoundIndex(def = "{'dmGroupId': 1, 'createdAt': -1}")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectMessage {

    @Id
    private String id;

    @Indexed
    private Long dmGroupId; // Reference to MySQL DirectMessageGroup ID

    @Indexed
    private Long senderId; // Reference to MySQL User ID

    private String senderUsername;

    private String senderDisplayName;

    private String senderAvatarUrl;

    private String content;

    @Builder.Default
    private MessageType type = MessageType.TEXT;

    // For reply
    private String parentMessageId;

    // Attachments
    @Builder.Default
    private List<Attachment> attachments = new ArrayList<>();

    // Embeds
    @Builder.Default
    private List<Embed> embeds = new ArrayList<>();

    // Mentions (only in group DM)
    @Builder.Default
    private List<Long> mentionedUserIds = new ArrayList<>();

    // Reactions
    @Builder.Default
    private List<Reaction> reactions = new ArrayList<>();

    // Edit
    @Builder.Default
    private Boolean isEdited = false;

    private LocalDateTime editedAt;

    @Builder.Default
    private List<EditHistory> editHistory = new ArrayList<>();

    // Deletion
    @Builder.Default
    private Boolean isDeleted = false;

    private LocalDateTime deletedAt;

    // Read receipts (who has read this message)
    @Builder.Default
    private Set<Long> readBy = new HashSet<>();

    // Timestamps
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum MessageType {
        TEXT,
        IMAGE,
        FILE,
        AUDIO,
        VIDEO,
        SYSTEM
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Attachment {
        private String id;
        private String fileName;
        private String fileUrl;
        private String fileType;
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
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Reaction {
        private String emoji;
        private String emojiId;
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
