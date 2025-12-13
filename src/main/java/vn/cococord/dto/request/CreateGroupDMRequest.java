package vn.cococord.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGroupDMRequest {

    @NotBlank(message = "Group name is required")
    @Size(max = 100, message = "Group name cannot exceed 100 characters")
    private String groupName;

    @NotEmpty(message = "Member list cannot be empty")
    @Size(min = 1, max = 9, message = "Group DM must have 1-9 members (10 including owner)")
    private List<Long> memberIds;
}
