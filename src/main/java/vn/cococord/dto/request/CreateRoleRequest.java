package vn.cococord.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoleRequest {

    @NotBlank(message = "Role name is required")
    @Size(min = 2, max = 100, message = "Role name must be between 2 and 100 characters")
    private String name;

    @Size(max = 7, message = "Color must be 7 characters (hex)")
    @Builder.Default
    private String color = "#99AAB5";

    @Builder.Default
    private Integer position = 0;

    @Builder.Default
    private Boolean isHoisted = false;

    @Builder.Default
    private Boolean isMentionable = true;
}
