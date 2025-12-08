package vn.cococord.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

@Data
public class UpdateProfileRequest {
    @Size(max = 50, message = "Display name must be at most 50 characters")
    private String displayName;

    @Email(message = "Invalid email format")
    private String email;

    private String avatarUrl;
}
