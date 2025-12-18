package vn.cococord.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserSettingsRequest {

    @Size(min = 3, max = 32, message = "Username must be between 3 and 32 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username can only contain letters, numbers, and underscores")
    private String username;

    @Email(message = "Invalid email format")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    private String email;

    @Size(max = 50, message = "Display name cannot exceed 50 characters")
    private String displayName;

    @Size(max = 190, message = "Bio (About Me) cannot exceed 190 characters")
    private String bio;

    @Size(max = 20, message = "Pronouns cannot exceed 20 characters")
    private String pronouns;

    @Pattern(regexp = "LIGHT|DARK", message = "Theme must be LIGHT or DARK")
    private String theme;

    @Pattern(regexp = "COMPACT|COZY", message = "Message display must be COMPACT or COZY")
    private String messageDisplay;

    private Boolean allowFriendRequests;
    private Boolean allowDirectMessages;
}
