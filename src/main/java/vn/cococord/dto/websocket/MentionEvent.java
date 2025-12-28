package vn.cococord.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * WebSocket event sent to users when they are mentioned in a message.
 * Used for real-time badge updates and notification sounds.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MentionEvent {
    
    private String type; // "mention"
    
    // Mentioner info
    private Long mentionerId;
    private String mentionerUsername;
    private String mentionerDisplayName;
    private String mentionerAvatarUrl;
    
    // Location info
    private Long channelId;
    private String channelName;
    private Long serverId;
    
    // Message reference
    private String messageId;
}
