package vn.cococord.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogCallEventRequest {

    @NotBlank(message = "callId cannot be empty")
    private String callId;

    private Boolean video;

    @Min(value = 1, message = "durationSeconds must be >= 1")
    private Integer durationSeconds;
}
