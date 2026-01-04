package vn.cococord.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminReportActionRequest {

    @NotBlank(message = "Action is required")
    private String action; // resolve, reject

    private String reason;
}
