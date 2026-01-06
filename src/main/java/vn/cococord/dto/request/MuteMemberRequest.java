package vn.cococord.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MuteMemberRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @Size(max = 1000, message = "Reason cannot exceed 1000 characters")
    private String reason;

    /**
     * Duration in minutes for the mute. Special values:
     * - 1440 = 1 day
     * - 10080 = 1 week
     * - 43200 = 1 month (30 days)
     * - null or -1 = permanent
     */
    private Integer durationMinutes;
}
