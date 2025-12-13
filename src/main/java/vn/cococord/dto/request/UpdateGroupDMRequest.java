package vn.cococord.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGroupDMRequest {

    @Size(max = 100, message = "Group name cannot exceed 100 characters")
    private String groupName;

    private String iconUrl;
}
