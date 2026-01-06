package vn.cococord.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import vn.cococord.entity.mysql.UserNitroSubscription;

@Repository
public interface IUserNitroSubscriptionRepository extends JpaRepository<UserNitroSubscription, Long> {
    
    List<UserNitroSubscription> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    @Query("SELECT s FROM UserNitroSubscription s WHERE s.user.id = :userId AND s.isActive = true AND s.endDate > CURRENT_TIMESTAMP")
    Optional<UserNitroSubscription> findActiveSubscription(Long userId);
    
    boolean existsByUserIdAndIsActiveTrue(Long userId);
    
    @Query("SELECT s FROM UserNitroSubscription s WHERE s.isActive = true AND s.endDate < CURRENT_TIMESTAMP")
    List<UserNitroSubscription> findExpiredSubscriptions();
}
