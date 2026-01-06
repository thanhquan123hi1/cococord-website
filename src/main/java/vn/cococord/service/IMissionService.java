package vn.cococord.service;

import java.util.List;

import vn.cococord.entity.mysql.Mission;
import vn.cococord.entity.mysql.UserMission;

public interface IMissionService {
    
    /**
     * Get all available missions
     */
    List<Mission> getAvailableMissions();
    
    /**
     * Get missions by type
     */
    List<Mission> getMissionsByType(Mission.MissionType type);
    
    /**
     * Get user's missions for current period
     */
    List<UserMission> getUserMissions(Long userId);
    
    /**
     * Get user's daily missions
     */
    List<UserMission> getUserDailyMissions(Long userId);
    
    /**
     * Get user's weekly missions
     */
    List<UserMission> getUserWeeklyMissions(Long userId);
    
    /**
     * Start/track a mission for user
     */
    UserMission startMission(Long userId, Long missionId);
    
    /**
     * Update mission progress (called when user performs an action)
     */
    void trackMissionProgress(Long userId, Mission.MissionAction action, Long targetId);
    
    /**
     * Claim reward for completed mission
     */
    UserMission claimReward(Long userId, Long userMissionId);
    
    /**
     * Get claimable rewards
     */
    List<UserMission> getClaimableRewards(Long userId);
    
    /**
     * Get completed mission count
     */
    long getCompletedMissionCount(Long userId);
    
    /**
     * Initialize daily missions for user
     */
    void initializeDailyMissions(Long userId);
    
    /**
     * Initialize weekly missions for user
     */
    void initializeWeeklyMissions(Long userId);
}
