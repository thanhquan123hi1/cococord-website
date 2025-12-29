package vn.cococord.service;

import java.util.List;
import java.util.Map;

import vn.cococord.dto.request.UpdateStatusRequest;
import vn.cococord.entity.mysql.User;

public interface IPresenceService {
    
    /**
     * Update user status (ONLINE, IDLE, DO_NOT_DISTURB, INVISIBLE, OFFLINE)
     */
    void updateStatus(UpdateStatusRequest request, String username);
    
    /**
     * Track user connection when they connect via WebSocket
     */
    void trackUserConnection(String username, String sessionId);
    
    /**
     * Remove user connection when they disconnect
     */
    void removeUserConnection(String username, String sessionId);
    
    /**
     * Get current status of a user
     */
    String getUserStatus(String username);
    
    /**
     * Get all online users in a server
     */
    List<Long> getOnlineUsersInServer(Long serverId);
    
    /**
     * Mark user as idle (auto-detection after 10 minutes)
     */
    void markUserAsIdle(String username);
    
    /**
     * Broadcast status change to friends and server members
     */
    void broadcastStatusChange(User user, String oldStatus, String newStatus);
    
    /**
     * Get presence data for multiple users
     */
    Map<Long, String> getUsersPresence(List<Long> userIds);
    
    /**
     * Clear expired custom statuses
     */
    void clearExpiredCustomStatuses();
    
    /**
     * Update last activity timestamp for a user
     */
    void updateLastActivity(String username);
}
