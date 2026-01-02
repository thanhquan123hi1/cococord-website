package vn.cococord.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.response.NotificationResponse;
import vn.cococord.entity.mysql.Notification;
import vn.cococord.entity.mysql.Notification.NotificationType;
import vn.cococord.entity.mysql.User;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.repository.INotificationRepository;
import vn.cococord.repository.IUserRepository;
import vn.cococord.service.INotificationService;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
@SuppressWarnings("null")
public class NotificationServiceImpl implements INotificationService {

    private final INotificationRepository notificationRepository;
    private final IUserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public NotificationResponse createNotification(User user, NotificationType type,
            String message, String link, String metadata) {
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .message(message)
                .link(link)
                .metadata(metadata)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        notification = saved;
        NotificationResponse response = mapToResponse(notification);

        // Send real-time notification via WebSocket
        sendRealTimeNotification(user.getId(), response);

        log.info("Created notification for user {}: type={}, message={}",
                user.getUsername(), type, message);

        return response;
    }

    @Override
    public void sendFriendRequestNotification(User sender, User receiver) {
        String senderName = sender.getDisplayName() != null ? sender.getDisplayName() : sender.getUsername();
        String message = String.format("%s đã gửi lời mời kết bạn", senderName);
        String link = "/friends/requests";
        String metadata = String.format("{\"senderId\": %d, \"senderUsername\": \"%s\"}",
                sender.getId(), sender.getUsername());

        createNotification(receiver, NotificationType.FRIEND_REQUEST, message, link, metadata);
    }

    @Override
    public void sendFriendAcceptedNotification(User accepter, User requester) {
        String accepterName = accepter.getDisplayName() != null ? accepter.getDisplayName() : accepter.getUsername();
        String message = String.format("%s đã chấp nhận lời mời kết bạn", accepterName);
        String link = "/friends";
        String metadata = String.format("{\"userId\": %d, \"username\": \"%s\"}",
                accepter.getId(), accepter.getUsername());

        createNotification(requester, NotificationType.FRIEND_ACCEPTED, message, link, metadata);
    }

    @Override
    public void sendNewDirectMessageNotification(User sender, User receiver, Long dmGroupId, String preview) {
        String senderName = sender.getDisplayName() != null ? sender.getDisplayName() : sender.getUsername();
        String clipped = preview.length() > 50 ? preview.substring(0, 50) + "..." : preview;
        String message = String.format("%s đã gửi cho bạn một tin nhắn: %s", senderName, clipped);
        String link = "/dms/" + dmGroupId;
        String metadata = String.format("{\"senderId\": %d, \"senderUsername\": \"%s\", \"dmGroupId\": %d}",
                sender.getId(), sender.getUsername(), dmGroupId);

        createNotification(receiver, NotificationType.NEW_DIRECT_MESSAGE, message, link, metadata);
    }

    @Override
    public void sendAddedToGroupDMNotification(User adder, User newMember, Long dmGroupId, String groupName) {
        String adderName = adder.getDisplayName() != null ? adder.getDisplayName() : adder.getUsername();
        String message = String.format("%s đã thêm bạn vào nhóm: %s", adderName,
                groupName != null ? groupName : "Nhóm chưa đặt tên");
        String link = "/dms/" + dmGroupId;
        String metadata = String.format("{\"adderId\": %d, \"dmGroupId\": %d, \"groupName\": \"%s\"}",
                adder.getId(), dmGroupId, groupName);

        createNotification(newMember, NotificationType.NEW_GROUP_DM, message, link, metadata);
    }

    @Override
    public void sendRemovedFromGroupDMNotification(Long dmGroupId, String groupName, User removedUser) {
        String message = String.format("Bạn đã bị xóa khỏi nhóm: %s",
                groupName != null ? groupName : "Nhóm chưa đặt tên");
        String link = "/dms";
        String metadata = String.format("{\"dmGroupId\": %d, \"groupName\": \"%s\"}",
                dmGroupId, groupName);

        createNotification(removedUser, NotificationType.REMOVED_FROM_GROUP_DM, message, link, metadata);
    }

    @Override
    public void sendServerInviteNotification(User inviter, User invitee, String serverName, String inviteLink) {
        String inviterName = inviter.getDisplayName() != null ? inviter.getDisplayName() : inviter.getUsername();
        String message = String.format("%s đã mời bạn tham gia %s", inviterName, serverName);
        String link = "/invite/" + inviteLink;
        String metadata = String.format("{\"inviterId\": %d, \"serverName\": \"%s\", \"inviteCode\": \"%s\"}",
                inviter.getId(), serverName, inviteLink);

        createNotification(invitee, NotificationType.SERVER_INVITE, message, link, metadata);
    }

    @Override
    public void sendMentionNotification(User mentioner, User mentioned, Long channelId, String channelName) {
        String mentionerName = mentioner.getDisplayName() != null ? mentioner.getDisplayName()
                : mentioner.getUsername();
        String message = String.format("%s đã đề cập đến bạn trong #%s", mentionerName, channelName);
        String link = "/channels/" + channelId;
        String metadata = String.format("{\"mentionerId\": %d, \"channelId\": %d, \"channelName\": \"%s\"}",
                mentioner.getId(), channelId, channelName);

        createNotification(mentioned, NotificationType.MENTION, message, link, metadata);
    }

    @Override
    public void sendRoleAssignedNotification(User user, String roleName, String serverName) {
        String message = String.format("Bạn đã được gán vai trò '%s' trong %s", roleName, serverName);
        String link = "/servers";
        String metadata = String.format("{\"roleName\": \"%s\", \"serverName\": \"%s\"}", roleName, serverName);

        createNotification(user, NotificationType.ROLE_ASSIGNED, message, link, metadata);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(String username, Pageable pageable) {
        User user = getUserByUsername(username);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnreadNotifications(String username) {
        User user = getUserByUsername(username);
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String username) {
        User user = getUserByUsername(username);
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    @Override
    public boolean markAsRead(Long notificationId, String username) {
        User user = getUserByUsername(username);
        int updated = notificationRepository.markAsRead(notificationId, user.getId());

        if (updated > 0) {
            // Send real-time update for notification count
            sendNotificationCountUpdate(user.getId());
        }

        return updated > 0;
    }

    @Override
    public int markAllAsRead(String username) {
        User user = getUserByUsername(username);
        int updated = notificationRepository.markAllAsRead(user.getId());

        if (updated > 0) {
            // Send real-time update for notification count
            sendNotificationCountUpdate(user.getId());
        }

        return updated;
    }

    @Override
    public boolean deleteNotification(Long notificationId, String username) {
        User user = getUserByUsername(username);
        Long id = notificationId;
        return notificationRepository.findById(id)
                .filter(n -> n.getUser().getId().equals(user.getId()))
                .map(n -> {
                    Notification toDelete = n;
                    notificationRepository.delete(toDelete);
                    sendNotificationCountUpdate(user.getId());
                    return true;
                })
                .orElse(false);
    }

    @Override
    public int cleanupOldNotifications(String username, int daysOld) {
        User user = getUserByUsername(username);
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysOld);
        return notificationRepository.deleteOldReadNotifications(user.getId(), cutoffDate);
    }

    // ================== Private Methods ==================

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType().name())
                .message(notification.getMessage())
                .link(notification.getLink())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .metadata(notification.getMetadata())
                .build();
    }

    private void sendRealTimeNotification(Long userId, NotificationResponse notification) {
        try {
            NotificationResponse notif = notification;
            messagingTemplate.convertAndSend("/topic/user." + userId + ".notifications", notif);
            log.debug("Sent real-time notification to user {}", userId);
        } catch (Exception e) {
            log.error("Failed to send real-time notification to user {}: {}", userId, e.getMessage());
        }
    }

    private void sendNotificationCountUpdate(Long userId) {
        try {
            long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);
            messagingTemplate.convertAndSend("/topic/user." + userId + ".notifications.count", unreadCount);
            log.debug("Sent notification count update to user {}: {}", userId, unreadCount);
        } catch (Exception e) {
            log.error("Failed to send notification count update to user {}: {}", userId, e.getMessage());
        }
    }
}
