package vn.cococord.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStatsResponse {

    // User stats
    private UserStats userStats;

    // Server stats
    private ServerStats serverStats;

    // Message stats
    private MessageStats messageStats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserStats {
        private long total;
        private long active;
        private long banned;
        private long newToday;
        private long newThisWeek;
        private long newThisMonth;
        private List<TimeSeriesData> growth;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ServerStats {
        private long total;
        private long active;
        private long newToday;
        private long newThisWeek;
        private long newThisMonth;
        private double avgMembersPerServer;
        private List<TimeSeriesData> growth;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageStats {
        private long totalToday;
        private long totalThisWeek;
        private long totalThisMonth;
        private double avgPerDay;
        private List<TimeSeriesData> volume;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TimeSeriesData {
        private String date;
        private long value;
    }
}
