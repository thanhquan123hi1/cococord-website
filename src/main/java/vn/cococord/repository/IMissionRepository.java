package vn.cococord.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import vn.cococord.entity.mysql.Mission;

@Repository
public interface IMissionRepository extends JpaRepository<Mission, Long> {
    
    List<Mission> findByIsActiveTrueOrderBySortOrderAsc();
    
    List<Mission> findByCategoryAndIsActiveTrueOrderBySortOrderAsc(Mission.MissionCategory category);
    
    List<Mission> findByTypeAndIsActiveTrueOrderBySortOrderAsc(Mission.MissionType type);
    
    @Query("SELECT m FROM Mission m WHERE m.isActive = true AND " +
           "(m.availableFrom IS NULL OR m.availableFrom <= CURRENT_TIMESTAMP) AND " +
           "(m.availableUntil IS NULL OR m.availableUntil >= CURRENT_TIMESTAMP) " +
           "ORDER BY m.sortOrder ASC")
    List<Mission> findAvailableMissions();
    
    @Query("SELECT m FROM Mission m WHERE m.isActive = true AND m.type = :type AND " +
           "(m.availableFrom IS NULL OR m.availableFrom <= CURRENT_TIMESTAMP) AND " +
           "(m.availableUntil IS NULL OR m.availableUntil >= CURRENT_TIMESTAMP) " +
           "ORDER BY m.sortOrder ASC")
    List<Mission> findAvailableMissionsByType(Mission.MissionType type);
    
    List<Mission> findByActionAndIsActiveTrue(Mission.MissionAction action);
}
