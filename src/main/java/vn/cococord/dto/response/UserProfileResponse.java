package vn.cococord.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String username;
    private String email;
    private String displayName;
    private String discriminator;
    private String avatarUrl;
    private String bannerUrl;
    private String bio;
    private String pronouns;
    private String status;
    private String customStatus;
    private String customStatusEmoji;
    private LocalDateTime customStatusExpiresAt;
    private String theme;
    private String messageDisplay;
    private Boolean isActive;
    private Boolean isBanned;
    private Boolean isEmailVerified;
    private Boolean twoFactorEnabled;
    private Boolean allowFriendRequests;
    private Boolean allowDirectMessages;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;

    // Additional fields for profile modal
    private String note; // Private note about this user (only visible to viewer)
    private List<ServerResponse> mutualServers;
    private List<String> badges;
}
