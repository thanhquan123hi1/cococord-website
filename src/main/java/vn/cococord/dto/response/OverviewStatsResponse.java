package vn.cococord.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Simplified response for Admin Dashboard Overview stats
 * All fields are guaranteed to be non-null with safe defaults
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OverviewStatsResponse {

    // Main KPI metrics - always non-null
    private long totalMessages;
    private long totalUsers;
    private long newUsersLast7Days;
    private long onlineUsers;

    // Growth percentages - always non-null, safe calculations
    @Builder.Default
    private GrowthStats growth = new GrowthStats();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GrowthStats {
        @Builder.Default
        private double messages = 0.0;

        @Builder.Default
        private double users = 0.0;

        @Builder.Default
        private double newUsers = 0.0;
    }
}
