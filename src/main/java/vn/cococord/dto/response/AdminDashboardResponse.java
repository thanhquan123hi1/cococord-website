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
    private long totalMessages;
    private long totalChannels;
    private long activeUsers24h;
    private long messagesToday;
    private long pendingReports;
    private long bannedUsers;
    private long onlineUsers;

    // New Users stats
    private long newUsersLast7Days;
    private long newUsersLast14Days;

    // Server stats
    private long activeServers;
    private long lockedServers;
    private long suspendedServers;
    private long newServersToday;

    // Growth percentages
    private double usersGrowth;
    private double serversGrowth;
    private double messagesGrowth;
    private double newUsersGrowth;

    // Server activity data (7 days)
    private List<DailyActivity> serverActivityChart;

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
        private String actionType;
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

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailyActivity {
        private String dayLabel;
        private String fullDate;
        private long messageCount;
        private long userJoins;
        private long channelCreations;
        private long totalActivity;
    }
}
