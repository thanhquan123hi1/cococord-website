package vn.cococord.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServerMuteResponse {

    private Long id;
    private Long serverId;
    
    // Muted user info
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    
    // Mute details
    private String reason;
    private LocalDateTime mutedAt;
    private LocalDateTime expiresAt;
    private boolean active;
    
    // Who muted
    private Long mutedById;
    private String mutedByUsername;
}
