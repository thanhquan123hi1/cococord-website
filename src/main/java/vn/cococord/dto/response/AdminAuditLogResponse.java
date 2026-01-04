package vn.cococord.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAuditLogResponse {

    private Long id;
    private String actionType;
    private String description;
    private String changes; // JSON

    // Actor info
    private Long actorId;
    private String actorUsername;
    private String actorAvatarUrl;

    // Target info (optional)
    private Long targetId;
    private String targetType;
    private String targetName;

    private String ipAddress;
    private LocalDateTime createdAt;
}
