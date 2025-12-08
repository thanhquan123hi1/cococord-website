package vn.cococord.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class AuditLogDto {
    private Long id;
    private String action;
    private String username;
    private String serverName;
    private String targetType;
    private Long targetId;
    private String details;
    private String ipAddress;
    private Instant createdAt;
}
