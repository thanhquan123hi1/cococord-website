package vn.cococord.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.cococord.entity.mysql.Mission;
import vn.cococord.entity.mysql.UserMission;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MissionResponse {
    private Long id;
    private String title;
    private String description;
    private Mission.MissionCategory category;
    private Mission.MissionType type;
    private Mission.MissionDifficulty difficulty;
    private BigDecimal rewardCredits;
    private Integer requiredCount;
    private String iconUrl;
    private String iconEmoji;
    
    // User progress
    private Long userMissionId;
    private Integer currentProgress;
    private UserMission.MissionStatus status;
    private Integer progressPercent;
    private LocalDateTime completedAt;
    private LocalDateTime rewardClaimedAt;
    
    // Time info
    private LocalDateTime availableFrom;
    private LocalDateTime availableUntil;
    private String resetSchedule;
}
