package vn.cococord.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for New Users statistics
 * Used in Admin Dashboard Overview - New Users Per Day chart
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewUsersStatsResponse {

    /**
     * Time range in days (7, 14, or 30)
     */
    private int range;

    /**
     * List of daily user counts
     */
    private List<DailyUserCount> data;

    /**
     * Inner class representing daily user count
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailyUserCount {

        /**
         * Date label (e.g., "Mon", "Tue", or "Jan 01")
         */
        private String date;

        /**
         * Number of new users registered on this date
         */
        private long count;

        /**
         * Full date in ISO format (for tooltip/debugging)
         */
        private String fullDate;
    }
}
