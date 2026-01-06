package vn.cococord.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.WeekFields;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.entity.mysql.Mission;
import vn.cococord.entity.mysql.User;
import vn.cococord.entity.mysql.UserMission;
import vn.cococord.exception.BadRequestException;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.repository.IMissionRepository;
import vn.cococord.repository.IUserMissionRepository;
import vn.cococord.repository.IUserRepository;
import vn.cococord.service.ICocoCreditsService;
import vn.cococord.service.IMissionService;

@Service
@RequiredArgsConstructor
@Slf4j
public class MissionServiceImpl implements IMissionService {

    private final IMissionRepository missionRepository;
    private final IUserMissionRepository userMissionRepository;
    private final IUserRepository userRepository;
    private final ICocoCreditsService creditsService;

    @Override
    @Transactional(readOnly = true)
    public List<Mission> getAvailableMissions() {
        return missionRepository.findAvailableMissions();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Mission> getMissionsByType(Mission.MissionType type) {
        return missionRepository.findAvailableMissionsByType(type);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserMission> getUserMissions(Long userId) {
        String dailyKey = getDailyPeriodKey();
        String weeklyKey = getWeeklyPeriodKey();
        
        List<UserMission> missions = userMissionRepository.findByUserIdOrderByStartedAtDesc(userId);
        // Filter to current period only
        return missions.stream()
                .filter(um -> {
                    if (um.getMission().getType() == Mission.MissionType.DAILY) {
                        return dailyKey.equals(um.getPeriodKey());
                    } else if (um.getMission().getType() == Mission.MissionType.WEEKLY) {
                        return weeklyKey.equals(um.getPeriodKey());
                    }
                    return true; // ONE_TIME and REPEATABLE
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserMission> getUserDailyMissions(Long userId) {
        String periodKey = getDailyPeriodKey();
        return userMissionRepository.findByUserIdAndMissionTypeAndPeriodKey(userId, Mission.MissionType.DAILY, periodKey);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserMission> getUserWeeklyMissions(Long userId) {
        String periodKey = getWeeklyPeriodKey();
        return userMissionRepository.findByUserIdAndMissionTypeAndPeriodKey(userId, Mission.MissionType.WEEKLY, periodKey);
    }

    @Override
    @Transactional
    public UserMission startMission(Long userId, Long missionId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found"));
        
        String periodKey = getPeriodKey(mission.getType());
        
        // Check if already started for this period
        Optional<UserMission> existing = userMissionRepository.findByUserIdAndMissionIdAndPeriodKey(userId, missionId, periodKey);
        if (existing.isPresent()) {
            return existing.get();
        }
        
        // Create new user mission
        UserMission userMission = UserMission.builder()
                .user(user)
                .mission(mission)
                .periodKey(periodKey)
                .currentProgress(0)
                .status(UserMission.MissionStatus.IN_PROGRESS)
                .build();
        
        userMission = userMissionRepository.save(userMission);
        log.info("User {} started mission: {}", userId, mission.getTitle());
        
        return userMission;
    }

    @Override
    @Transactional
    public void trackMissionProgress(Long userId, Mission.MissionAction action, Long targetId) {
        // Find missions that track this action
        List<Mission> missions = missionRepository.findByActionAndIsActiveTrue(action);
        
        for (Mission mission : missions) {
            String periodKey = getPeriodKey(mission.getType());
            
            // Get or create user mission
            UserMission userMission = userMissionRepository
                    .findByUserIdAndMissionIdAndPeriodKey(userId, mission.getId(), periodKey)
                    .orElseGet(() -> {
                        User user = userRepository.findById(userId).orElse(null);
                        if (user == null) return null;
                        
                        return userMissionRepository.save(UserMission.builder()
                                .user(user)
                                .mission(mission)
                                .periodKey(periodKey)
                                .currentProgress(0)
                                .status(UserMission.MissionStatus.IN_PROGRESS)
                                .build());
                    });
            
            if (userMission == null) continue;
            
            // Check if already completed
            if (userMission.getStatus() == UserMission.MissionStatus.CLAIMED) {
                continue;
            }
            
            // Check target if specified
            if (mission.getTargetId() != null && !mission.getTargetId().equals(targetId)) {
                continue;
            }
            
            // Increment progress
            userMission.incrementProgress();
            userMissionRepository.save(userMission);
            
            log.debug("User {} mission progress: {} - {}/{}", 
                    userId, mission.getTitle(), userMission.getCurrentProgress(), mission.getRequiredCount());
        }
    }

    @Override
    @Transactional
    public UserMission claimReward(Long userId, Long userMissionId) {
        UserMission userMission = userMissionRepository.findById(userMissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission progress not found"));
        
        // Verify ownership
        if (!userMission.getUser().getId().equals(userId)) {
            throw new BadRequestException("This is not your mission");
        }
        
        // Check if completed
        if (userMission.getStatus() != UserMission.MissionStatus.COMPLETED) {
            throw new BadRequestException("Mission is not completed yet");
        }
        
        // Award credits
        creditsService.addCredits(userId, 
                userMission.getMission().getRewardCredits(),
                "Mission reward: " + userMission.getMission().getTitle(),
                "MISSION", userMission.getMission().getId());
        
        // Update status
        userMission.setStatus(UserMission.MissionStatus.CLAIMED);
        userMission.setRewardClaimed(userMission.getMission().getRewardCredits());
        userMission.setRewardClaimedAt(LocalDateTime.now());
        userMission = userMissionRepository.save(userMission);
        
        log.info("User {} claimed reward for mission: {} (+{} credits)", 
                userId, userMission.getMission().getTitle(), userMission.getMission().getRewardCredits());
        
        return userMission;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserMission> getClaimableRewards(Long userId) {
        return userMissionRepository.findClaimableRewards(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public long getCompletedMissionCount(Long userId) {
        return userMissionRepository.countCompletedMissions(userId);
    }

    @Override
    @Transactional
    public void initializeDailyMissions(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        String periodKey = getDailyPeriodKey();
        List<Mission> dailyMissions = missionRepository.findAvailableMissionsByType(Mission.MissionType.DAILY);
        
        for (Mission mission : dailyMissions) {
            if (!userMissionRepository.existsByUserIdAndMissionIdAndPeriodKey(userId, mission.getId(), periodKey)) {
                UserMission userMission = UserMission.builder()
                        .user(user)
                        .mission(mission)
                        .periodKey(periodKey)
                        .currentProgress(0)
                        .status(UserMission.MissionStatus.IN_PROGRESS)
                        .build();
                userMissionRepository.save(userMission);
            }
        }
    }

    @Override
    @Transactional
    public void initializeWeeklyMissions(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        String periodKey = getWeeklyPeriodKey();
        List<Mission> weeklyMissions = missionRepository.findAvailableMissionsByType(Mission.MissionType.WEEKLY);
        
        for (Mission mission : weeklyMissions) {
            if (!userMissionRepository.existsByUserIdAndMissionIdAndPeriodKey(userId, mission.getId(), periodKey)) {
                UserMission userMission = UserMission.builder()
                        .user(user)
                        .mission(mission)
                        .periodKey(periodKey)
                        .currentProgress(0)
                        .status(UserMission.MissionStatus.IN_PROGRESS)
                        .build();
                userMissionRepository.save(userMission);
            }
        }
    }

    // Helper methods
    private String getPeriodKey(Mission.MissionType type) {
        return switch (type) {
            case DAILY -> getDailyPeriodKey();
            case WEEKLY -> getWeeklyPeriodKey();
            case MONTHLY -> getMonthlyPeriodKey();
            default -> "permanent";
        };
    }

    private String getDailyPeriodKey() {
        return LocalDate.now().toString(); // e.g., "2026-01-06"
    }

    private String getWeeklyPeriodKey() {
        LocalDate now = LocalDate.now();
        WeekFields weekFields = WeekFields.of(Locale.getDefault());
        int week = now.get(weekFields.weekOfWeekBasedYear());
        int year = now.getYear();
        return year + "-W" + String.format("%02d", week); // e.g., "2026-W01"
    }

    private String getMonthlyPeriodKey() {
        LocalDate now = LocalDate.now();
        return now.getYear() + "-" + String.format("%02d", now.getMonthValue()); // e.g., "2026-01"
    }
}
