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
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long expiresIn; // Access token expiration in milliseconds

    // User info
    private Long userId;
    private String username;
    private String email;
    private String displayName;
    private String avatarUrl;
    private String role;

    private LocalDateTime loginAt;
}
