package vn.cococord.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardResponse {

    // Summary statistics
    private long totalUsers;
    private long totalServers;
    private long activeUsers24h;
    private long messagesToday;
    private long pendingReports;
    private long bannedUsers;
    private long onlineUsers;

    // Growth percentages
    private double usersGrowth;
    private double serversGrowth;
    private double messagesGrowth;

    // Recent activity
    private List<ActivityItem> recentActivity;

    // Charts data
    private List<ChartDataPoint> userGrowthChart;
    private List<ChartDataPoint> serverGrowthChart;
    private List<ChartDataPoint> messageVolumeChart;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActivityItem {
        private Long id;
        private String action;
        private String user;
        private String target;
        private String targetType;
        private LocalDateTime timestamp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChartDataPoint {
        private String label;
        private long value;
        private LocalDateTime date;
    }
}
