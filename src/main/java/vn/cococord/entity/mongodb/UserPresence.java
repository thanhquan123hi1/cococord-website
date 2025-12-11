package vn.cococord.entity.mongodb;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "user_presence")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPresence {

    @Id
    private String id;

    @Indexed(unique = true)
    private Long userId;

    private String username;

    @Builder.Default
    private Status status = Status.OFFLINE;

    private String customStatus;

    private String customStatusEmoji;

    private LocalDateTime customStatusExpiresAt;

    // Last activity tracking
    private LocalDateTime lastSeen;

    // Device info
    private String deviceType; // WEB, MOBILE, DESKTOP

    @Builder.Default
    private Boolean isMobile = false;

    // Auto-expire after 2 minutes of inactivity (handled by MongoDB TTL)
    // Note: Configure TTL index in MongoDB configuration or repository
    @Indexed
    @Builder.Default
    private LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(2);

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum Status {
        ONLINE, IDLE, DO_NOT_DISTURB, OFFLINE, INVISIBLE
    }
}
