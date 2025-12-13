package vn.cococord.controller.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.cococord.dto.request.CreateGroupDMRequest;
import vn.cococord.dto.request.SendDirectMessageRequest;
import vn.cococord.dto.request.UpdateGroupDMRequest;
import vn.cococord.entity.mongodb.DirectMessage;
import vn.cococord.entity.mysql.DirectMessageGroup;
import vn.cococord.entity.mysql.User;
import vn.cococord.repository.IUserRepository;
import vn.cococord.service.IDirectMessageService;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/direct-messages")
@RequiredArgsConstructor
@Slf4j
public class DirectMessageController {

    private final IUserRepository userRepository;

    private Long getUserIdFromUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }

    private final IDirectMessageService directMessageService;

    /**
     * Get all DM groups for current user
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<DirectMessageGroup>> getConversations(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromUsername(userDetails.getUsername());
        List<DirectMessageGroup> dmGroups = directMessageService.getDMGroupsForUser(userId);
        return ResponseEntity.ok(dmGroups);
    }

    /**
     * Create or get 1-1 DM with another user
     */
    @PostMapping("/create-dm/{userId}")
    public ResponseEntity<DirectMessageGroup> createOrGetDM(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long currentUserId = getUserIdFromUsername(userDetails.getUsername());
        DirectMessageGroup dmGroup = directMessageService.createOrGetOneToOneDM(currentUserId, userId);
        return ResponseEntity.ok(dmGroup);
    }

    /**
     * Create a group DM
     */
    @PostMapping("/create-group")
    public ResponseEntity<DirectMessageGroup> createGroupDM(
            @Valid @RequestBody CreateGroupDMRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromUsername(userDetails.getUsername());
        DirectMessageGroup dmGroup = directMessageService.createGroupDM(
                userId,
                request.getMemberIds(),
                request.getGroupName());
        return ResponseEntity.ok(dmGroup);
    }

    /**
     * Get DM group by ID
     */
    @GetMapping("/{dmGroupId}")
    public ResponseEntity<DirectMessageGroup> getDMGroup(
            @PathVariable Long dmGroupId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromUsername(userDetails.getUsername());
        DirectMessageGroup dmGroup = directMessageService.getDMGroupById(dmGroupId, userId);
        return ResponseEntity.ok(dmGroup);
    }

    /**
     * Update group DM (name, icon) - owner only
     */
    @PutMapping("/{dmGroupId}")
    public ResponseEntity<DirectMessageGroup> updateGroupDM(
            @PathVariable Long dmGroupId,
            @Valid @RequestBody UpdateGroupDMRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromUsername(userDetails.getUsername());
        DirectMessageGroup updated = directMessageService.updateGroupDM(
                dmGroupId,
                userId,
                request.getGroupName(),
                request.getIconUrl());
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete DM group
     */
    @DeleteMapping("/{dmGroupId}")
    public ResponseEntity<Map<String, String>> deleteDMGroup(
            @PathVariable Long dmGroupId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromUsername(userDetails.getUsername());
        directMessageService.deleteDMGroup(dmGroupId, userId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "DM group deleted successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Add member to group DM
     */
    @PostMapping("/{dmGroupId}/members/{userId}")
    public ResponseEntity<Map<String, String>> addMember(
            @PathVariable Long dmGroupId,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long currentUserId = getUserIdFromUsername(userDetails.getUsername());
        directMessageService.addMemberToGroup(dmGroupId, userId, currentUserId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Member added successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Remove member from group DM (or leave)
     */
    @DeleteMapping("/{dmGroupId}/members/{userId}")
    public ResponseEntity<Map<String, String>> removeMember(
            @PathVariable Long dmGroupId,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long currentUserId = getUserIdFromUsername(userDetails.getUsername());
        directMessageService.removeMemberFromGroup(dmGroupId, userId, currentUserId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Member removed successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Send a direct message
     */
    @PostMapping("/{dmGroupId}/messages")
    public ResponseEntity<DirectMessage> sendMessage(
            @PathVariable Long dmGroupId,
            @Valid @RequestBody SendDirectMessageRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromUsername(userDetails.getUsername());
        DirectMessage message = directMessageService.sendDirectMessageWithAttachments(
                dmGroupId,
                userId,
                request.getContent(),
                request.getAttachmentUrls());
        return ResponseEntity.ok(message);
    }

    /**
     * Get messages in DM group (paginated)
     */
    @GetMapping("/{dmGroupId}/messages")
    public ResponseEntity<Page<DirectMessage>> getMessages(
            @PathVariable Long dmGroupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromUsername(userDetails.getUsername());
        Pageable pageable = PageRequest.of(page, size);
        Page<DirectMessage> messages = directMessageService.getDirectMessages(dmGroupId, userId,
                pageable);
        return ResponseEntity.ok(messages);
    }

    /**
     * Edit a direct message
     */
    @PutMapping("/messages/{messageId}")
    public ResponseEntity<DirectMessage> editMessage(
            @PathVariable String messageId,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromUsername(userDetails.getUsername());
        DirectMessage updated = directMessageService.editDirectMessage(
                messageId,
                userId,
                payload.get("content"));
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a direct message
     */
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Map<String, String>> deleteMessage(
            @PathVariable String messageId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromUsername(userDetails.getUsername());
        directMessageService.deleteDirectMessage(messageId, userId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Message deleted successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Mark messages as read
     */
    @PostMapping("/{dmGroupId}/read")
    public ResponseEntity<Map<String, String>> markAsRead(
            @PathVariable Long dmGroupId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromUsername(userDetails.getUsername());
        directMessageService.markAsRead(dmGroupId, userId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Messages marked as read");
        return ResponseEntity.ok(response);
    }

    /**
     * Get unread count
     */
    @GetMapping("/{dmGroupId}/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @PathVariable Long dmGroupId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromUsername(userDetails.getUsername());
        long count = directMessageService.getUnreadCount(dmGroupId, userId);
        Map<String, Long> response = new HashMap<>();
        response.put("unreadCount", count);
        return ResponseEntity.ok(response);
    }

    /**
     * Search messages in DM group
     */
    @GetMapping("/{dmGroupId}/search")
    public ResponseEntity<List<DirectMessage>> searchMessages(
            @PathVariable Long dmGroupId,
            @RequestParam String query,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromUsername(userDetails.getUsername());
        List<DirectMessage> results = directMessageService.searchMessages(dmGroupId, userId, query);
        return ResponseEntity.ok(results);
    }

    /**
     * Mute/unmute DM group
     */
    @PostMapping("/{dmGroupId}/mute")
    public ResponseEntity<Map<String, String>> toggleMute(
            @PathVariable Long dmGroupId,
            @RequestBody Map<String, Boolean> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromUsername(userDetails.getUsername());
        boolean muted = payload.getOrDefault("muted", false);
        directMessageService.toggleMute(dmGroupId, userId, muted);
        Map<String, String> response = new HashMap<>();
        response.put("message", muted ? "DM group muted" : "DM group unmuted");
        return ResponseEntity.ok(response);
    }
}
