package vn.cococord.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class ServerInviteDto {
    private Long id;
    private String code;
    private String inviteUrl;
    private Long serverId;
    private String serverName;
    private String createdByUsername;
    private Instant expiryDate;
    private Integer maxUses;
    private int uses;
    private boolean active;
    private Instant createdAt;
}
