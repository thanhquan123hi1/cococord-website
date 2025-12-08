package vn.cococord.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class ServerBanDto {
    private Long id;
    private Long userId;
    private String username;
    private String avatarUrl;
    private String bannedByUsername;
    private String reason;
    private Instant bannedAt;
}
