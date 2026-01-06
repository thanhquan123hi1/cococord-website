package vn.cococord.service;

import vn.cococord.dto.request.SendFriendRequestRequest;
import vn.cococord.dto.response.FriendRequestResponse;
import vn.cococord.dto.response.UserProfileResponse;

import java.util.List;

/**
 * Service for Friend & Block Management
 */
public interface IFriendService {

    // ===== FRIEND REQUESTS =====

    /**
     * Send a friend request to another user
     */
    FriendRequestResponse sendFriendRequest(SendFriendRequestRequest request, String username);

    /**
     * Accept a friend request
     */
    void acceptFriendRequest(Long requestId, String username);

    /**
     * Decline a friend request
     */
    void declineFriendRequest(Long requestId, String username);

    /**
     * Cancel a sent friend request
     */
    void cancelFriendRequest(Long requestId, String username);

    /**
     * Get pending friend requests (received)
     */
    List<FriendRequestResponse> getPendingRequests(String username);

    /**
     * Get sent friend requests
     */
    List<FriendRequestResponse> getSentRequests(String username);

    /**
     * Get all friend requests (sent and received)
     */
    List<FriendRequestResponse> getAllFriendRequests(String username);

    // ===== FRIENDS LIST =====

    /**
     * Get all friends for a user
     */
    List<UserProfileResponse> getFriends(String username);

    /**
     * Remove a friend
     */
    void removeFriend(Long friendId, String username);

    /**
     * Check if two users are friends
     */
    boolean areFriends(Long userId1, Long userId2);

    // ===== BLOCKED USERS =====

    /**
     * Block a user
     */
    void blockUser(Long userId, String username);

    /**
     * Unblock a user
     */
    void unblockUser(Long userId, String username);

    /**
     * Get list of blocked users
     */
    List<UserProfileResponse> getBlockedUsers(String username);

    /**
     * Check if user A has blocked user B
     */
    boolean hasBlocked(Long blockerId, Long blockedId);

    // ===== SERVER FRIENDS =====

    /**
     * Get friends who are not member of a server
     */
    List<UserProfileResponse> getFriendsNotInServer(String username, Long serverId);
}
