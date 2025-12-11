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
public class ServerMemberResponse {
    private Long id;
    private Long serverId;
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private Long roleId;
    private String roleName;
    private String nickname;
    private Boolean isMuted;
    private Boolean isDeafened;
    private LocalDateTime joinedAt;
}
