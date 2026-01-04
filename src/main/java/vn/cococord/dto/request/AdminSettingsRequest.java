package vn.cococord.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminSettingsRequest {

    private Boolean registrationEnabled;
    private Boolean maintenanceMode;
    private Integer maxServersPerUser;
    private Integer maxMembersPerServer;
    private Integer maxChannelsPerServer;
    private Integer maxRolesPerServer;
    private Integer maxMessageLength;
    private Integer maxFileSize; // in MB
    private String allowedFileTypes;
    private String siteName;
    private String siteDescription;
    private String contactEmail;
}
