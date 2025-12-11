package vn.cococord.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteLinkResponse {
    private Long id;
    private Long serverId;
    private String serverName;
    private Long channelId;
    private String channelName;
    private String code;
    private String inviteUrl;
    private Integer maxUses;
    private Integer currentUses;
    private LocalDateTime expiresAt;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private String createdBy;
}
