package vn.cococord.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDMGroupRequest {

    @NotNull(message = "User IDs are required")
    private List<Long> userIds;

    private String name; // Optional for group DM

    private String iconUrl;
}
