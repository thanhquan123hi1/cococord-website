package vn.cococord.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * DTO for presence change events broadcast via Redis Pub/Sub.
 * Used for cross-instance synchronization of user online/offline status.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresenceChangeEvent implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    private Long userId;
    private String username;
    private String oldStatus;
    private String newStatus;
    private String customStatus;
    private String customStatusEmoji;
    private LocalDateTime timestamp;
    
    /**
     * Server instance ID that originated this event.
     * Used to prevent echo back to the same instance.
     */
    private String originInstanceId;
}
