package vn.cococord.controller.user;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.response.MessageResponse;
import vn.cococord.entity.mysql.Notification;
import vn.cococord.entity.mysql.Server;
import vn.cococord.entity.mysql.InviteLink;
import vn.cococord.entity.mysql.ServerMember;
import vn.cococord.entity.mysql.User;
import vn.cococord.exception.BadRequestException;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.repository.INotificationRepository;
import vn.cococord.repository.IInviteLinkRepository;
import vn.cococord.repository.IServerMemberRepository;
import vn.cococord.repository.IServerRepository;
import vn.cococord.service.IUserService;

@RestController
@RequestMapping("/api/invites")
@RequiredArgsConstructor
@Slf4j
public class InviteNotificationController {

    private final INotificationRepository notificationRepository;
    private final IServerRepository serverRepository;
    private final IInviteLinkRepository inviteLinkRepository;
    private final IServerMemberRepository serverMemberRepository;
    private final IUserService userService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Send a server invite notification to a user (real-time via WebSocket)
     */
    @PostMapping("/send")
    public ResponseEntity<MessageResponse> sendInvite(
            @RequestBody @Valid vn.cococord.dto.request.SendInviteRequest request,
            Authentication authentication) {

        log.info("[INVITE] Raw request body: {}", request);

        Long recipientId = request.getRecipientId();
        Long serverId = request.getServerId();
        String inviteCode = request.getInviteCode();

        log.info("[INVITE] Parsed IDs: recId={}, srvId={}, code={}", recipientId, serverId, inviteCode);

        String senderUsername = authentication.getName();
        User sender = userService.getUserByUsername(senderUsername);

        // Get recipient
        User recipient = userService.getUserById(recipientId);

        // Get server
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found"));

        // Check if sender is a member of the server
        boolean isMember = serverMemberRepository.existsByServerIdAndUserId(server.getId(), sender.getId());
        if (!isMember) {
            throw new BadRequestException("You are not a member of this server");
        }

        // Check if recipient is already a member
        boolean recipientIsMember = serverMemberRepository.existsByServerIdAndUserId(server.getId(), recipient.getId());
        if (recipientIsMember) {
            throw new BadRequestException("User is already a member of this server");
        }

        // Get or create invite code
        if (inviteCode == null || inviteCode.isEmpty()) {
            // Try to find existing invite or create new one
            List<InviteLink> existingInvites = inviteLinkRepository.findActiveByServerId(server.getId());
            InviteLink invite = existingInvites.stream()
                    .filter(i -> i.getCreatedBy().getId().equals(sender.getId()))
                    .findFirst()
                    .orElse(null);
            if (invite == null) {
                invite = InviteLink.builder()
                        .server(server)
                        .createdBy(sender)
                        .code(generateInviteCode())
                        .maxUses(0)
                        .expiresAt(LocalDateTime.now().plusDays(7))
                        .build();
                invite = inviteLinkRepository.save(invite);
            }
            inviteCode = invite.getCode();
        }

        // Create metadata JSON
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("serverId", server.getId());
        metadata.put("serverName", server.getName());
        metadata.put("serverIconUrl", server.getIconUrl());
        metadata.put("inviteCode", inviteCode);
        metadata.put("senderId", sender.getId());
        metadata.put("senderUsername", sender.getUsername());
        metadata.put("senderDisplayName", sender.getDisplayName());
        metadata.put("senderAvatarUrl", sender.getAvatarUrl());

        String metadataJson;
        try {
            metadataJson = objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            metadataJson = "{}";
        }

        // Create notification
        Notification notification = Notification.builder()
                .user(recipient)
                .type(Notification.NotificationType.SERVER_INVITE)
                .message("Bạn được mời tham gia server " + server.getName())
                .link("/invite/" + inviteCode)
                .metadata(metadataJson)
                .isRead(false)
                .build();

        log.info("[INVITE DEBUG] Saving notification...");
        try {
            notification = notificationRepository.save(notification);
            notificationRepository.flush(); // Force immediate execution
        } catch (Exception e) {
            log.error("[INVITE CRITICAL] Failed to save notification: {}", e.getMessage(), e);
            throw e;
        }

        log.info("[INVITE] Notification saved with ID: {}", notification.getId());
        log.info("[INVITE] Server invite notification sent from {} to {} for server {}",
                sender.getUsername(), recipient.getUsername(), server.getName());

        // Send real-time WebSocket notification to recipient
        Map<String, Object> wsPayload = new HashMap<>();
        wsPayload.put("type", "SERVER_INVITE");
        wsPayload.put("notificationId", notification.getId());
        wsPayload.put("serverId", server.getId());
        wsPayload.put("serverName", server.getName());
        wsPayload.put("serverIconUrl", server.getIconUrl());
        wsPayload.put("inviteCode", inviteCode);
        wsPayload.put("senderId", sender.getId());
        wsPayload.put("senderUsername", sender.getUsername());
        wsPayload.put("senderDisplayName", sender.getDisplayName());
        wsPayload.put("senderAvatarUrl", sender.getAvatarUrl());
        wsPayload.put("message", notification.getMessage());
        wsPayload.put("createdAt", LocalDateTime.now().toString());

        String topic = "/topic/user." + recipient.getId() + ".notifications";
        log.info("[INVITE] Broadcasting to WebSocket topic: {}", topic);
        log.info("[INVITE] WebSocket payload: {}", wsPayload);
        messagingTemplate.convertAndSend(topic, wsPayload);
        log.info("[INVITE] WebSocket message sent successfully");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new MessageResponse("Invite sent successfully"));
    }

    /**
     * Accept a server invite notification
     */
    @PostMapping("/{notificationId}/accept")
    public ResponseEntity<Map<String, Object>> acceptInvite(
            @PathVariable Long notificationId,
            Authentication authentication) {

        String username = authentication.getName();
        User user = userService.getUserByUsername(username);

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        // Verify notification belongs to user
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("This notification is not for you");
        }

        // Verify it's a server invite
        if (notification.getType() != Notification.NotificationType.SERVER_INVITE) {
            throw new BadRequestException("This is not a server invite");
        }

        // Parse metadata
        Map<String, Object> metadata;
        try {
            metadata = objectMapper.readValue(notification.getMetadata(), Map.class);
        } catch (Exception e) {
            throw new BadRequestException("Invalid notification data");
        }

        Long serverId = Long.valueOf(metadata.get("serverId").toString());
        String inviteCode = (String) metadata.get("inviteCode");

        // Check if already a member
        if (serverMemberRepository.existsByServerIdAndUserId(serverId, user.getId())) {
            // Delete notification and return success
            notificationRepository.delete(notification);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Already a member");
            response.put("serverId", serverId);
            return ResponseEntity.ok(response);
        }

        // Join server
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Server no longer exists"));

        ServerMember member = ServerMember.builder()
                .server(server)
                .user(user)
                .build();
        serverMemberRepository.save(member);

        // Mark notification as read and delete it
        notificationRepository.delete(notification);

        log.info("User {} accepted invite and joined server {}", username, server.getName());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Joined server successfully");
        response.put("serverId", serverId);
        response.put("serverName", server.getName());

        return ResponseEntity.ok(response);
    }

    /**
     * Decline a server invite notification
     */
    @PostMapping("/{notificationId}/decline")
    public ResponseEntity<MessageResponse> declineInvite(
            @PathVariable Long notificationId,
            Authentication authentication) {

        String username = authentication.getName();
        User user = userService.getUserByUsername(username);

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        // Verify notification belongs to user
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("This notification is not for you");
        }

        // Delete notification
        notificationRepository.delete(notification);

        log.info("User {} declined server invite", username);

        return ResponseEntity.ok(new MessageResponse("Invite declined"));
    }

    /**
     * Get all pending invite notifications for current user
     */
    @GetMapping("/pending")
    public ResponseEntity<List<Map<String, Object>>> getPendingInvites(Authentication authentication) {
        String username = authentication.getName();
        User user = userService.getUserByUsername(username);

        List<Notification> notifications = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(user.getId())
                .stream()
                .filter(n -> n.getType() == Notification.NotificationType.SERVER_INVITE)
                .collect(Collectors.toList());

        List<Map<String, Object>> result = notifications.stream().map(n -> {
            Map<String, Object> item = new HashMap<>();
            item.put("notificationId", n.getId());
            item.put("message", n.getMessage());
            item.put("createdAt", n.getCreatedAt());

            try {
                Map<String, Object> metadata = objectMapper.readValue(n.getMetadata(), Map.class);
                item.putAll(metadata);
            } catch (Exception ignored) {
            }

            return item;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    private String generateInviteCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 8; i++) {
            int idx = (int) (Math.random() * chars.length());
            sb.append(chars.charAt(idx));
        }
        return sb.toString();
    }

    // Inner class SendInviteRequest removed, using standalone class in
    // vn.cococord.dto.request
}
