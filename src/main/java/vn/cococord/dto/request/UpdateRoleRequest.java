package vn.cococord.dto.request;

import java.util.List;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRoleRequest {

    @Size(min = 1, max = 100, message = "Role name must be between 1 and 100 characters")
    private String name;

    @Size(max = 7, message = "Color must be a valid hex color code")
    private String color;

    private Long permissions; // Permission bitmask

    private List<String> permissionsList; // Alternative: list of permission keys

    private Integer position; // Role hierarchy position

    private Boolean hoist; // Display role members separately

    private Boolean mentionable; // Allow anyone to @mention this role
}
