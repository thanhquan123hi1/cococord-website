package vn.cococord.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.cococord.entity.mysql.Notification;

import java.util.List;

@Repository
public interface INotificationRepository extends JpaRepository<Notification, Long> {

    // Find notifications by user ID ordered by creation time
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // Find unread notifications by user ID
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    // Count unread notifications
    long countByUserIdAndIsReadFalse(Long userId);

    // Find notifications by user ID and type
    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(
            Long userId, Notification.NotificationType type);

    // Mark all notifications as read for a user
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.user.id = :userId AND n.isRead = false")
    int markAllAsRead(@Param("userId") Long userId);

    // Mark specific notification as read
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.id = :notificationId AND n.user.id = :userId")
    int markAsRead(@Param("notificationId") Long notificationId, @Param("userId") Long userId);

    // Delete old notifications (cleanup job)
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.user.id = :userId AND n.isRead = true AND n.createdAt < :cutoffDate")
    int deleteOldReadNotifications(@Param("userId") Long userId,
            @Param("cutoffDate") java.time.LocalDateTime cutoffDate);

    // Delete all notifications for a user
    void deleteByUserId(Long userId);
}
