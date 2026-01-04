package vn.cococord.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminRoleRequest {

    @NotBlank(message = "Role name is required")
    private String name;

    private String description;

    private String color;

    private List<String> permissions;
}
