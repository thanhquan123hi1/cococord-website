package vn.cococord.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import vn.cococord.entity.mysql.Mission;
import vn.cococord.entity.mysql.UserMission;

@Repository
public interface IUserMissionRepository extends JpaRepository<UserMission, Long> {
    
    List<UserMission> findByUserIdOrderByStartedAtDesc(Long userId);
    
    Optional<UserMission> findByUserIdAndMissionIdAndPeriodKey(Long userId, Long missionId, String periodKey);
    
    List<UserMission> findByUserIdAndPeriodKey(Long userId, String periodKey);
    
    List<UserMission> findByUserIdAndStatus(Long userId, UserMission.MissionStatus status);
    
    @Query("SELECT um FROM UserMission um WHERE um.user.id = :userId AND um.mission.type = :type AND um.periodKey = :periodKey")
    List<UserMission> findByUserIdAndMissionTypeAndPeriodKey(Long userId, Mission.MissionType type, String periodKey);
    
    @Query("SELECT COUNT(um) FROM UserMission um WHERE um.user.id = :userId AND um.status = 'CLAIMED'")
    long countCompletedMissions(Long userId);
    
    @Query("SELECT um FROM UserMission um WHERE um.user.id = :userId AND um.status = 'COMPLETED'")
    List<UserMission> findClaimableRewards(Long userId);
    
    boolean existsByUserIdAndMissionIdAndPeriodKey(Long userId, Long missionId, String periodKey);
}
