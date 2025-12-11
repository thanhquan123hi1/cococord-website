package vn.cococord.controller.user;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.cococord.dto.request.CreateDMGroupRequest;
import vn.cococord.dto.request.SendFriendRequestRequest;
import vn.cococord.dto.response.DMGroupResponse;
import vn.cococord.dto.response.FriendRequestResponse;
import vn.cococord.dto.response.MessageResponse;
import vn.cococord.dto.response.UserProfileResponse;

import java.util.List;

/**
 * REST Controller for Friend & Direct Message Management
 * Handles friend requests, blocked users, and DM groups
 */
@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    // TODO: Inject services when implemented
    // private final FriendService friendService;
    // private final DMService dmService;

    // ===== FRIEND MANAGEMENT =====

    /**
     * GET /api/friends
     * Get all friends for current user
     */
    @GetMapping
    public ResponseEntity<List<UserProfileResponse>> getFriends(
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement friendService.getFriends(userDetails.getUsername())
        return ResponseEntity.ok(List.of());
    }

    /**
     * GET /api/friends/requests
     * Get all friend requests (sent and received)
     */
    @GetMapping("/requests")
    public ResponseEntity<List<FriendRequestResponse>> getFriendRequests(
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement friendService.getFriendRequests(userDetails.getUsername())
        return ResponseEntity.ok(List.of());
    }

    /**
     * GET /api/friends/requests/pending
     * Get pending friend requests (received only)
     */
    @GetMapping("/requests/pending")
    public ResponseEntity<List<FriendRequestResponse>> getPendingFriendRequests(
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement friendService.getPendingRequests(userDetails.getUsername())
        return ResponseEntity.ok(List.of());
    }

    /**
     * POST /api/friends/requests
     * Send friend request
     */
    @PostMapping("/requests")
    public ResponseEntity<FriendRequestResponse> sendFriendRequest(
            @Valid @RequestBody SendFriendRequestRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement friendService.sendFriendRequest(request, userDetails.getUsername())
        return ResponseEntity.status(HttpStatus.CREATED).body(FriendRequestResponse.builder().build());
    }

    /**
     * POST /api/friends/requests/{requestId}/accept
     * Accept friend request
     */
    @PostMapping("/requests/{requestId}/accept")
    public ResponseEntity<MessageResponse> acceptFriendRequest(
            @PathVariable Long requestId,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement friendService.acceptFriendRequest(requestId, userDetails.getUsername())
        return ResponseEntity.ok(new MessageResponse("Friend request accepted"));
    }

    /**
     * POST /api/friends/requests/{requestId}/decline
     * Decline friend request
     */
    @PostMapping("/requests/{requestId}/decline")
    public ResponseEntity<MessageResponse> declineFriendRequest(
            @PathVariable Long requestId,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement friendService.declineFriendRequest(requestId, userDetails.getUsername())
        return ResponseEntity.ok(new MessageResponse("Friend request declined"));
    }

    /**
     * DELETE /api/friends/{userId}
     * Remove friend
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<MessageResponse> removeFriend(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement friendService.removeFriend(userId, userDetails.getUsername())
        return ResponseEntity.ok(new MessageResponse("Friend removed successfully"));
    }

    // ===== BLOCKED USERS =====

    /**
     * GET /api/friends/blocked
     * Get all blocked users
     */
    @GetMapping("/blocked")
    public ResponseEntity<List<UserProfileResponse>> getBlockedUsers(
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement friendService.getBlockedUsers(userDetails.getUsername())
        return ResponseEntity.ok(List.of());
    }

    /**
     * POST /api/friends/blocked/{userId}
     * Block user
     */
    @PostMapping("/blocked/{userId}")
    public ResponseEntity<MessageResponse> blockUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement friendService.blockUser(userId, userDetails.getUsername())
        return ResponseEntity.ok(new MessageResponse("User blocked successfully"));
    }

    /**
     * DELETE /api/friends/blocked/{userId}
     * Unblock user
     */
    @DeleteMapping("/blocked/{userId}")
    public ResponseEntity<MessageResponse> unblockUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement friendService.unblockUser(userId, userDetails.getUsername())
        return ResponseEntity.ok(new MessageResponse("User unblocked successfully"));
    }

    // ===== DIRECT MESSAGE GROUPS =====

    /**
     * GET /api/friends/dm-groups
     * Get all DM groups for current user
     */
    @GetMapping("/dm-groups")
    public ResponseEntity<List<DMGroupResponse>> getDMGroups(
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement dmService.getDMGroups(userDetails.getUsername())
        return ResponseEntity.ok(List.of());
    }

    /**
     * POST /api/friends/dm-groups
     * Create DM group (1-1 or group)
     */
    @PostMapping("/dm-groups")
    public ResponseEntity<DMGroupResponse> createDMGroup(
            @Valid @RequestBody CreateDMGroupRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement dmService.createDMGroup(request, userDetails.getUsername())
        return ResponseEntity.status(HttpStatus.CREATED).body(DMGroupResponse.builder().build());
    }

    /**
     * GET /api/friends/dm-groups/{groupId}
     * Get DM group by ID
     */
    @GetMapping("/dm-groups/{groupId}")
    public ResponseEntity<DMGroupResponse> getDMGroup(
            @PathVariable Long groupId,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement dmService.getDMGroupById(groupId, userDetails.getUsername())
        return ResponseEntity.ok(DMGroupResponse.builder().build());
    }

    /**
     * DELETE /api/friends/dm-groups/{groupId}
     * Leave/delete DM group
     */
    @DeleteMapping("/dm-groups/{groupId}")
    public ResponseEntity<MessageResponse> leaveDMGroup(
            @PathVariable Long groupId,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement dmService.leaveDMGroup(groupId, userDetails.getUsername())
        return ResponseEntity.ok(new MessageResponse("Left DM group successfully"));
    }

    /**
     * POST /api/friends/dm-groups/{groupId}/members
     * Add member to group DM
     */
    @PostMapping("/dm-groups/{groupId}/members")
    public ResponseEntity<MessageResponse> addMemberToDMGroup(
            @PathVariable Long groupId,
            @RequestParam Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement dmService.addMember(groupId, userId, userDetails.getUsername())
        return ResponseEntity.ok(new MessageResponse("Member added to DM group"));
    }

    /**
     * DELETE /api/friends/dm-groups/{groupId}/members/{userId}
     * Remove member from group DM
     */
    @DeleteMapping("/dm-groups/{groupId}/members/{userId}")
    public ResponseEntity<MessageResponse> removeMemberFromDMGroup(
            @PathVariable Long groupId,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement dmService.removeMember(groupId, userId, userDetails.getUsername())
        return ResponseEntity.ok(new MessageResponse("Member removed from DM group"));
    }
}
