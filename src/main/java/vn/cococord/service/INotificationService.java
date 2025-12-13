package vn.cococord.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.cococord.dto.response.NotificationResponse;
import vn.cococord.entity.mysql.Notification;
import vn.cococord.entity.mysql.User;

import java.util.List;

public interface INotificationService {

    /**
     * Create a notification for a user
     */
    NotificationResponse createNotification(User user, Notification.NotificationType type,
            String message, String link, String metadata);

    /**
     * Send friend request notification
     */
    void sendFriendRequestNotification(User sender, User receiver);

    /**
     * Send friend accepted notification
     */
    void sendFriendAcceptedNotification(User accepter, User requester);

    /**
     * Send new direct message notification
     */
    void sendNewDirectMessageNotification(User sender, User receiver, Long dmGroupId, String preview);

    /**
     * Send added to group DM notification
     */
    void sendAddedToGroupDMNotification(User adder, User newMember, Long dmGroupId, String groupName);

    /**
     * Send removed from group DM notification
     */
    void sendRemovedFromGroupDMNotification(Long dmGroupId, String groupName, User removedUser);

    /**
     * Send server invite notification
     */
    void sendServerInviteNotification(User inviter, User invitee, String serverName, String inviteLink);

    /**
     * Send mention notification
     */
    void sendMentionNotification(User mentioner, User mentioned, Long channelId, String channelName);

    /**
     * Send role assigned notification
     */
    void sendRoleAssignedNotification(User user, String roleName, String serverName);

    /**
     * Get paginated notifications for a user
     */
    Page<NotificationResponse> getNotifications(String username, Pageable pageable);

    /**
     * Get unread notifications for a user
     */
    List<NotificationResponse> getUnreadNotifications(String username);

    /**
     * Get unread notification count
     */
    long getUnreadCount(String username);

    /**
     * Mark a notification as read
     */
    boolean markAsRead(Long notificationId, String username);

    /**
     * Mark all notifications as read
     */
    int markAllAsRead(String username);

    /**
     * Delete a notification
     */
    boolean deleteNotification(Long notificationId, String username);

    /**
     * Clean up old read notifications (older than 30 days)
     */
    int cleanupOldNotifications(String username, int daysOld);
}
