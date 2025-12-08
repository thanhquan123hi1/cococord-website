package vn.cococord.service;

import vn.cococord.dto.NotificationDto;
import vn.cococord.entity.*;
import vn.cococord.repository.NotificationRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository, SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public void sendNotification(User recipient, NotificationType type, String message,
            User fromUser, Server server, Channel channel, Conversation conversation) {
        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setType(type);
        notification.setMessage(message);
        notification.setFromUser(fromUser);
        notification.setServer(server);
        notification.setChannel(channel);
        notification.setConversation(conversation);
        notification.setCreatedAt(LocalDateTime.now());

        notificationRepository.save(notification);

        // Send via WebSocket
        NotificationDto dto = toDto(notification);
        messagingTemplate.convertAndSendToUser(
                recipient.getUsername(),
                "/queue/notifications",
                dto);
    }

    public void sendFriendRequestNotification(User recipient, User fromUser) {
        sendNotification(recipient, NotificationType.FRIEND_REQUEST,
                fromUser.getUsername() + " sent you a friend request",
                fromUser, null, null, null);
    }

    public void sendFriendAcceptedNotification(User recipient, User fromUser) {
        sendNotification(recipient, NotificationType.FRIEND_ACCEPTED,
                fromUser.getUsername() + " accepted your friend request",
                fromUser, null, null, null);
    }

    public void sendServerInviteNotification(User recipient, User fromUser, Server server) {
        sendNotification(recipient, NotificationType.SERVER_INVITE,
                fromUser.getUsername() + " invited you to join " + server.getName(),
                fromUser, server, null, null);
    }

    public void sendNewMessageNotification(User recipient, User fromUser, Channel channel) {
        sendNotification(recipient, NotificationType.NEW_MESSAGE,
                "New message from " + fromUser.getUsername() + " in #" + channel.getName(),
                fromUser, channel.getServer(), channel, null);
    }

    public void sendDmNotification(User recipient, User fromUser, Conversation conversation) {
        sendNotification(recipient, NotificationType.NEW_DM,
                "New message from " + fromUser.getUsername(),
                fromUser, null, null, conversation);
    }

    public void sendKickedNotification(User recipient, Server server) {
        sendNotification(recipient, NotificationType.KICKED,
                "You have been kicked from " + server.getName(),
                null, server, null, null);
    }

    public void sendBannedNotification(User recipient, Server server) {
        sendNotification(recipient, NotificationType.BANNED,
                "You have been banned from " + server.getName(),
                null, server, null, null);
    }

    public List<NotificationDto> getUserNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<NotificationDto> getUnreadNotifications(User user) {
        return notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByUserAndIsReadFalse(user);
    }

    public void markAsRead(Long notificationId, User user) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUser().getId().equals(user.getId())) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    public void markAllAsRead(User user) {
        notificationRepository.markAllAsReadByUser(user);
    }

    private NotificationDto toDto(Notification notification) {
        NotificationDto dto = new NotificationDto();
        dto.setId(notification.getId());
        dto.setType(notification.getType().name());
        dto.setMessage(notification.getMessage());
        dto.setFromUsername(notification.getFromUser() != null ? notification.getFromUser().getUsername() : null);
        dto.setServerId(notification.getServer() != null ? notification.getServer().getId() : null);
        dto.setServerName(notification.getServer() != null ? notification.getServer().getName() : null);
        dto.setChannelId(notification.getChannel() != null ? notification.getChannel().getId() : null);
        dto.setChannelName(notification.getChannel() != null ? notification.getChannel().getName() : null);
        dto.setConversationId(notification.getConversation() != null ? notification.getConversation().getId() : null);
        dto.setRead(notification.isRead());
        dto.setCreatedAt(notification.getCreatedAt().toString());
        return dto;
    }
}
