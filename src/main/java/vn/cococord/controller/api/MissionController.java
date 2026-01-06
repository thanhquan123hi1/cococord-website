package vn.cococord.controller.api;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import vn.cococord.dto.response.MissionResponse;
import vn.cococord.entity.mysql.Mission;
import vn.cococord.entity.mysql.User;
import vn.cococord.entity.mysql.UserMission;
import vn.cococord.security.CurrentUser;
import vn.cococord.service.IMissionService;

@RestController
@RequestMapping("/api/missions")
@RequiredArgsConstructor
public class MissionController {

    private final IMissionService missionService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllMissions(@CurrentUser User user) {
        List<UserMission> dailyMissions = missionService.getUserDailyMissions(user.getId());
        List<UserMission> weeklyMissions = missionService.getUserWeeklyMissions(user.getId());
        List<Mission> oneTimeMissions = missionService.getMissionsByType(Mission.MissionType.ONE_TIME);
        List<UserMission> userOneTime = missionService.getUserMissions(user.getId()).stream()
                .filter(um -> um.getMission().getType() == Mission.MissionType.ONE_TIME)
                .collect(Collectors.toList());
        
        Map<Long, UserMission> oneTimeProgressMap = userOneTime.stream()
                .collect(Collectors.toMap(um -> um.getMission().getId(), um -> um));
        
        List<MissionResponse> dailyResponses = dailyMissions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        List<MissionResponse> weeklyResponses = weeklyMissions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        List<MissionResponse> oneTimeResponses = oneTimeMissions.stream()
                .map(m -> mapToResponse(m, oneTimeProgressMap.get(m.getId())))
                .collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("daily", dailyResponses);
        response.put("weekly", weeklyResponses);
        response.put("oneTime", oneTimeResponses);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/daily")
    public ResponseEntity<List<MissionResponse>> getDailyMissions(@CurrentUser User user) {
        List<UserMission> missions = missionService.getUserDailyMissions(user.getId());
        List<MissionResponse> response = missions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<MissionResponse>> getWeeklyMissions(@CurrentUser User user) {
        List<UserMission> missions = missionService.getUserWeeklyMissions(user.getId());
        List<MissionResponse> response = missions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<MissionResponse>> getMissionsByType(
            @CurrentUser User user,
            @PathVariable Mission.MissionType type) {
        
        List<Mission> missions = missionService.getMissionsByType(type);
        List<UserMission> userMissions = missionService.getUserMissions(user.getId());
        
        Map<Long, UserMission> progressMap = userMissions.stream()
                .filter(um -> um.getMission().getType() == type)
                .collect(Collectors.toMap(um -> um.getMission().getId(), um -> um));
        
        List<MissionResponse> response = missions.stream()
                .map(m -> mapToResponse(m, progressMap.get(m.getId())))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{missionId}/start")
    public ResponseEntity<MissionResponse> startMission(
            @CurrentUser User user,
            @PathVariable Long missionId) {
        
        UserMission userMission = missionService.startMission(user.getId(), missionId);
        return ResponseEntity.ok(mapToResponse(userMission));
    }

    @PostMapping("/{userMissionId}/claim")
    public ResponseEntity<MissionResponse> claimReward(
            @CurrentUser User user,
            @PathVariable Long userMissionId) {
        
        UserMission userMission = missionService.claimReward(user.getId(), userMissionId);
        return ResponseEntity.ok(mapToResponse(userMission));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getMissionSummary(@CurrentUser User user) {
        List<UserMission> allMissions = missionService.getUserMissions(user.getId());
        
        long dailyCompleted = allMissions.stream()
                .filter(um -> um.getMission().getType() == Mission.MissionType.DAILY)
                .filter(um -> um.getStatus() == UserMission.MissionStatus.COMPLETED || 
                             um.getStatus() == UserMission.MissionStatus.CLAIMED)
                .count();
        
        long dailyTotal = allMissions.stream()
                .filter(um -> um.getMission().getType() == Mission.MissionType.DAILY)
                .count();
        
        long weeklyCompleted = allMissions.stream()
                .filter(um -> um.getMission().getType() == Mission.MissionType.WEEKLY)
                .filter(um -> um.getStatus() == UserMission.MissionStatus.COMPLETED || 
                             um.getStatus() == UserMission.MissionStatus.CLAIMED)
                .count();
        
        long weeklyTotal = allMissions.stream()
                .filter(um -> um.getMission().getType() == Mission.MissionType.WEEKLY)
                .count();
        
        long claimable = allMissions.stream()
                .filter(um -> um.getStatus() == UserMission.MissionStatus.COMPLETED)
                .count();
        
        Map<String, Object> response = new HashMap<>();
        response.put("dailyCompleted", dailyCompleted);
        response.put("dailyTotal", dailyTotal);
        response.put("weeklyCompleted", weeklyCompleted);
        response.put("weeklyTotal", weeklyTotal);
        response.put("claimableRewards", claimable);
        
        return ResponseEntity.ok(response);
    }

    private MissionResponse mapToResponse(UserMission userMission) {
        Mission mission = userMission.getMission();
        return MissionResponse.builder()
                .id(mission.getId())
                .title(mission.getTitle())
                .description(mission.getDescription())
                .category(mission.getCategory())
                .type(mission.getType())
                .difficulty(mission.getDifficulty())
                .rewardCredits(mission.getRewardCredits())
                .requiredCount(mission.getRequiredCount())
                .iconUrl(mission.getIconUrl())
                .iconEmoji(mission.getIconEmoji())
                .userMissionId(userMission.getId())
                .currentProgress(userMission.getCurrentProgress())
                .status(userMission.getStatus())
                .progressPercent(userMission.getProgressPercent())
                .completedAt(userMission.getCompletedAt())
                .rewardClaimedAt(userMission.getRewardClaimedAt())
                .availableFrom(mission.getAvailableFrom())
                .availableUntil(mission.getAvailableUntil())
                .resetSchedule(mission.getResetSchedule())
                .build();
    }

    private MissionResponse mapToResponse(Mission mission, UserMission userMission) {
        MissionResponse.MissionResponseBuilder builder = MissionResponse.builder()
                .id(mission.getId())
                .title(mission.getTitle())
                .description(mission.getDescription())
                .category(mission.getCategory())
                .type(mission.getType())
                .difficulty(mission.getDifficulty())
                .rewardCredits(mission.getRewardCredits())
                .requiredCount(mission.getRequiredCount())
                .iconUrl(mission.getIconUrl())
                .iconEmoji(mission.getIconEmoji())
                .availableFrom(mission.getAvailableFrom())
                .availableUntil(mission.getAvailableUntil())
                .resetSchedule(mission.getResetSchedule());
        
        if (userMission != null) {
            builder.userMissionId(userMission.getId())
                    .currentProgress(userMission.getCurrentProgress())
                    .status(userMission.getStatus())
                    .progressPercent(userMission.getProgressPercent())
                    .completedAt(userMission.getCompletedAt())
                    .rewardClaimedAt(userMission.getRewardClaimedAt());
        } else {
            builder.currentProgress(0)
                    .status(null)
                    .progressPercent(0);
        }
        
        return builder.build();
    }
}
