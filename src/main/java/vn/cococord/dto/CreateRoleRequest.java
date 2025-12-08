package vn.cococord.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Data
public class CreateRoleRequest {
    @NotBlank(message = "Role name is required")
    private String name;

    private String color;

    private List<String> permissions;
}
