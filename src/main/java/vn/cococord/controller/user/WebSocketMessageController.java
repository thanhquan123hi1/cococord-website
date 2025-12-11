package vn.cococord.controller.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import vn.cococord.dto.request.EditMessageRequest;
import vn.cococord.dto.request.SendMessageRequest;
import vn.cococord.dto.response.ChatMessageResponse;
import vn.cococord.service.MessageService;

import java.security.Principal;

/**
 * WebSocket Controller for realtime chat messaging
 * Handles STOMP protocol messages
 */
@Controller
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class WebSocketMessageController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Send message to a channel
     * Client sends to: /app/chat.sendMessage
     * Broadcast to: /topic/channel/{channelId}
     */
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload SendMessageRequest request, Principal principal) {
        try {
            String username = principal.getName();
            log.info("Received message from user: {} to channel: {}", username, request.getChannelId());

            // Save message
            ChatMessageResponse response = messageService.sendMessage(request, username);

            // Broadcast to all subscribers of this channel
            messagingTemplate.convertAndSend(
                    "/topic/channel/" + request.getChannelId(),
                    response);

            log.info("Message broadcast to channel: {}", request.getChannelId());
        } catch (Exception e) {
            log.error("Error sending message: {}", e.getMessage(), e);

            // Send error to user
            messagingTemplate.convertAndSendToUser(
                    principal.getName(),
                    "/queue/errors",
                    "Failed to send message: " + e.getMessage());
        }
    }

    /**
     * Edit existing message
     * Client sends to: /app/chat.editMessage
     */
    @MessageMapping("/chat.editMessage")
    public void editMessage(@Payload EditMessageRequest request, Principal principal) {
        try {
            String username = principal.getName();
            log.info("User: {} editing message: {}", username, request.getMessageId());

            ChatMessageResponse response = messageService.editMessage(request, username);

            // Broadcast edited message to channel
            messagingTemplate.convertAndSend(
                    "/topic/channel/" + response.getChannelId(),
                    response);

            log.info("Edited message broadcast to channel: {}", response.getChannelId());
        } catch (Exception e) {
            log.error("Error editing message: {}", e.getMessage(), e);

            messagingTemplate.convertAndSendToUser(
                    principal.getName(),
                    "/queue/errors",
                    "Failed to edit message: " + e.getMessage());
        }
    }

    /**
     * Delete message
     * Client sends to: /app/chat.deleteMessage
     */
    @MessageMapping("/chat.deleteMessage")
    public void deleteMessage(@Payload String messageId, Principal principal) {
        try {
            String username = principal.getName();
            log.info("User: {} deleting message: {}", username, messageId);

            // Get message details before deletion
            ChatMessageResponse message = messageService.getMessageById(messageId);
            Long channelId = message.getChannelId();

            // Delete message
            messageService.deleteMessage(messageId, username);

            // Notify channel about deletion
            messagingTemplate.convertAndSend(
                    "/topic/channel/" + channelId + "/delete",
                    messageId);

            log.info("Message deletion broadcast to channel: {}", channelId);
        } catch (Exception e) {
            log.error("Error deleting message: {}", e.getMessage(), e);

            messagingTemplate.convertAndSendToUser(
                    principal.getName(),
                    "/queue/errors",
                    "Failed to delete message: " + e.getMessage());
        }
    }

    /**
     * User typing indicator
     * Client sends to: /app/chat.typing
     */
    @MessageMapping("/chat.typing")
    public void userTyping(@Payload TypingNotification notification, Principal principal) {
        String username = principal.getName();
        notification.setUsername(username);

        // Broadcast typing indicator to channel (except sender)
        messagingTemplate.convertAndSend(
                "/topic/channel/" + notification.getChannelId() + "/typing",
                notification);
    }

    /**
     * User presence update (online/offline)
     * Client sends to: /app/presence.update
     */
    @MessageMapping("/presence.update")
    public void updatePresence(@Payload PresenceUpdate presence, Principal principal) {
        String username = principal.getName();
        presence.setUsername(username);

        log.info("User {} presence updated to: {}", username, presence.getStatus());

        // Broadcast presence to all users (or specific servers)
        messagingTemplate.convertAndSend("/topic/presence", presence);
    }

    // DTOs for WebSocket messages
    public static class TypingNotification {
        private Long channelId;
        private String username;
        private boolean isTyping;

        public TypingNotification() {
        }

        public Long getChannelId() {
            return channelId;
        }

        public void setChannelId(Long channelId) {
            this.channelId = channelId;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public boolean isTyping() {
            return isTyping;
        }

        public void setTyping(boolean typing) {
            isTyping = typing;
        }
    }

    public static class PresenceUpdate {
        private String username;
        private String status; // ONLINE, IDLE, DO_NOT_DISTURB, OFFLINE

        public PresenceUpdate() {
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }
}
