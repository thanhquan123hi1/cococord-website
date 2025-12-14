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
import vn.cococord.entity.mongodb.DirectMessage;
import vn.cococord.service.IMessageService;
import vn.cococord.service.IDirectMessageService;

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

    private final IMessageService messageService;
    private final IDirectMessageService directMessageService;
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

    /**
     * Send direct message (DM or Group DM)
     * Client sends to: /app/dm.sendMessage
     * Broadcast to: /topic/dm/{dmGroupId}
     */
    @MessageMapping("/dm.sendMessage")
    public void sendDirectMessage(@Payload DirectMessagePayload payload, Principal principal) {
        try {
            String username = principal.getName();
            log.info("Received DM from user: {} to DM group: {}", username, payload.getDmGroupId());

            // Save direct message
            DirectMessage message = directMessageService.sendDirectMessageWithAttachments(
                    payload.getDmGroupId(),
                    payload.getSenderId(),
                    payload.getContent(),
                    payload.getAttachmentUrls());

            // Broadcast to all members of this DM group
            messagingTemplate.convertAndSend(
                    "/topic/dm/" + payload.getDmGroupId(),
                    message);

            log.info("Direct message broadcast to DM group: {}", payload.getDmGroupId());
        } catch (Exception e) {
            log.error("Error sending direct message: {}", e.getMessage(), e);

            messagingTemplate.convertAndSendToUser(
                    principal.getName(),
                    "/queue/errors",
                    "Failed to send direct message: " + e.getMessage());
        }
    }

    /**
     * Edit direct message
     * Client sends to: /app/dm.editMessage
     */
    @MessageMapping("/dm.editMessage")
    public void editDirectMessage(@Payload DirectMessageEditPayload payload, Principal principal) {
        try {
            String username = principal.getName();
            log.info("User: {} editing DM: {}", username, payload.getMessageId());

            DirectMessage message = directMessageService.editDirectMessage(
                    payload.getMessageId(),
                    payload.getSenderId(),
                    payload.getNewContent());

            // Broadcast edited message to DM group
            messagingTemplate.convertAndSend(
                    "/topic/dm/" + message.getDmGroupId(),
                    message);

            log.info("Edited DM broadcast to DM group: {}", message.getDmGroupId());
        } catch (Exception e) {
            log.error("Error editing direct message: {}", e.getMessage(), e);

            messagingTemplate.convertAndSendToUser(
                    principal.getName(),
                    "/queue/errors",
                    "Failed to edit direct message: " + e.getMessage());
        }
    }

    /**
     * Delete direct message
     * Client sends to: /app/dm.deleteMessage
     */
    @MessageMapping("/dm.deleteMessage")
    public void deleteDirectMessage(@Payload DirectMessageDeletePayload payload, Principal principal) {
        try {
            String username = principal.getName();
            log.info("User: {} deleting DM: {}", username, payload.getMessageId());

            directMessageService.deleteDirectMessage(payload.getMessageId(), payload.getUserId());

            // Notify DM group about deletion
            messagingTemplate.convertAndSend(
                    "/topic/dm/" + payload.getDmGroupId() + "/delete",
                    payload.getMessageId());

            log.info("DM deletion broadcast to DM group: {}", payload.getDmGroupId());
        } catch (Exception e) {
            log.error("Error deleting direct message: {}", e.getMessage(), e);

            messagingTemplate.convertAndSendToUser(
                    principal.getName(),
                    "/queue/errors",
                    "Failed to delete direct message: " + e.getMessage());
        }
    }

    /**
     * User typing in DM
     * Client sends to: /app/dm.typing
     */
    @MessageMapping("/dm.typing")
    public void userTypingInDM(@Payload DMTypingNotification notification, Principal principal) {
        String username = principal.getName();
        notification.setUsername(username);

        // Broadcast typing indicator to DM group (except sender)
        messagingTemplate.convertAndSend(
                "/topic/dm/" + notification.getDmGroupId() + "/typing",
                notification);
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

    // DTOs for Direct Message WebSocket
    public static class DirectMessagePayload {
        private Long dmGroupId;
        private Long senderId;
        private String content;
        private java.util.List<String> attachmentUrls;

        public DirectMessagePayload() {
        }

        public Long getDmGroupId() {
            return dmGroupId;
        }

        public void setDmGroupId(Long dmGroupId) {
            this.dmGroupId = dmGroupId;
        }

        public Long getSenderId() {
            return senderId;
        }

        public void setSenderId(Long senderId) {
            this.senderId = senderId;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public java.util.List<String> getAttachmentUrls() {
            return attachmentUrls;
        }

        public void setAttachmentUrls(java.util.List<String> attachmentUrls) {
            this.attachmentUrls = attachmentUrls;
        }
    }

    public static class DirectMessageEditPayload {
        private String messageId;
        private Long senderId;
        private String newContent;

        public DirectMessageEditPayload() {
        }

        public String getMessageId() {
            return messageId;
        }

        public void setMessageId(String messageId) {
            this.messageId = messageId;
        }

        public Long getSenderId() {
            return senderId;
        }

        public void setSenderId(Long senderId) {
            this.senderId = senderId;
        }

        public String getNewContent() {
            return newContent;
        }

        public void setNewContent(String newContent) {
            this.newContent = newContent;
        }
    }

    public static class DirectMessageDeletePayload {
        private String messageId;
        private Long dmGroupId;
        private Long userId;

        public DirectMessageDeletePayload() {
        }

        public String getMessageId() {
            return messageId;
        }

        public void setMessageId(String messageId) {
            this.messageId = messageId;
        }

        public Long getDmGroupId() {
            return dmGroupId;
        }

        public void setDmGroupId(Long dmGroupId) {
            this.dmGroupId = dmGroupId;
        }

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }
    }

    public static class DMTypingNotification {
        private Long dmGroupId;
        private String username;
        private boolean isTyping;

        public DMTypingNotification() {
        }

        public Long getDmGroupId() {
            return dmGroupId;
        }

        public void setDmGroupId(Long dmGroupId) {
            this.dmGroupId = dmGroupId;
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
}
