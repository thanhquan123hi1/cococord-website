package vn.cococord.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStatusRequest {

    @NotBlank(message = "Status is required")
    @Pattern(regexp = "ONLINE|IDLE|DO_NOT_DISTURB|OFFLINE|INVISIBLE", 
             message = "Invalid status value")
    private String status;

    @Size(max = 128, message = "Custom status cannot exceed 128 characters")
    private String customStatus;

    @Size(max = 10, message = "Custom status emoji cannot exceed 10 characters")
    private String customStatusEmoji;

    // Duration in minutes: null = don't clear, 0 = clear on next login
    private Integer customStatusDuration;
}
