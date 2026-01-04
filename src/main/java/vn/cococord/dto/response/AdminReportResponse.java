package vn.cococord.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminReportResponse {

    private Long id;
    private String type; // user, message, server
    private String reason;
    private String description;
    private String status; // pending, resolved, rejected

    // Reporter info
    private Long reporterId;
    private String reporterUsername;
    private String reporterAvatarUrl;

    // Reported entity info
    private Long reportedId;
    private String reportedUsername;
    private String reportedAvatarUrl;
    private String reportedContent; // For message reports

    // Resolution info
    private Long resolvedById;
    private String resolvedByUsername;
    private String resolutionNote;
    private LocalDateTime resolvedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
