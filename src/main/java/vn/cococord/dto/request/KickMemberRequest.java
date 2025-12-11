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
public class KickMemberRequest {

    @Size(max = 1000, message = "Reason cannot exceed 1000 characters")
    private String reason;
}
