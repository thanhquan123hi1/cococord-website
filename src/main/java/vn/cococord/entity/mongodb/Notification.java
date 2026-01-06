package vn.cococord.entity.mongodb;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Notification entity for storing user notifications
 * including server invites, friend requests, etc.
 */
@Document(collection = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    private String id;

    /**
     * User who receives this notification
     */
    @Indexed
    private Long recipientId;

    /**
     * User who sent/triggered this notification
     */
    private Long senderId;
    private String senderUsername;
    private String senderDisplayName;
    private String senderAvatarUrl;

    /**
     * Type of notification
     */
    private NotificationType type;

    /**
     * Related entity ID (e.g., serverId for SERVER_INVITE)
     */
    private Long relatedEntityId;

    /**
     * Related entity name (e.g., server name)
     */
    private String relatedEntityName;

    /**
     * Invite code for server invites
     */
    private String inviteCode;

    /**
     * Custom message
     */
    private String message;

    /**
     * Has this notification been read?
     */
    @Builder.Default
    private Boolean isRead = false;

    /**
     * Has this notification been acted upon (accepted/declined)?
     */
    @Builder.Default
    private Boolean isActedUpon = false;

    /**
     * Action result (ACCEPTED, DECLINED, null if not acted upon)
     */
    private ActionResult actionResult;

    @CreatedDate
    private LocalDateTime createdAt;

    /**
     * Expiration time (for invites)
     */
    private LocalDateTime expiresAt;

    public enum NotificationType {
        SERVER_INVITE,
        FRIEND_REQUEST,
        MENTION,
        SYSTEM
    }

    public enum ActionResult {
        ACCEPTED,
        DECLINED,
        EXPIRED
    }
}
