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
public class AdminSettingsResponse {

    private Long id;
    private Boolean registrationEnabled;
    private Boolean maintenanceMode;
    private Integer maxServersPerUser;
    private Integer maxMembersPerServer;
    private Integer maxChannelsPerServer;
    private Integer maxRolesPerServer;
    private Integer maxMessageLength;
    private Integer maxFileSize;
    private String allowedFileTypes;
    private String siteName;
    private String siteDescription;
    private String contactEmail;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
