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
public class ServerBanResponse {

    private Long id;
    private Long serverId;
    
    // Banned user info
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    
    // Ban details
    private String reason;
    private LocalDateTime bannedAt;
    private LocalDateTime expiresAt;
    
    // Who banned
    private Long bannedById;
    private String bannedByUsername;
}
