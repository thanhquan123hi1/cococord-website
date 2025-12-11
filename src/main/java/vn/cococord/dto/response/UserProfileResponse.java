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
public class UserProfileResponse {
    private Long id;
    private String username;
    private String email;
    private String displayName;
    private String avatarUrl;
    private String bio;
    private String status;
    private String customStatus;
    private Boolean isActive;
    private Boolean isBanned;
    private Boolean isEmailVerified;
    private Boolean twoFactorEnabled;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
}
