package vn.cococord.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.cococord.dto.response.ServerResponse;
import vn.cococord.dto.response.UserProfileResponse;

import java.util.Map;

public interface IAdminService {

    /**
     * Get all users with pagination
     */
    Page<UserProfileResponse> getAllUsers(Pageable pageable, String search);

    /**
     * Ban a user from the system
     */
    void banUser(Long userId, String adminUsername);

    /**
     * Unban a user
     */
    void unbanUser(Long userId, String adminUsername);

    /**
     * Update user role
     */
    void updateUserRole(Long userId, String role, String adminUsername);

    /**
     * Delete a user account
     */
    void deleteUser(Long userId, String adminUsername);

    /**
     * Get all servers with pagination
     */
    Page<ServerResponse> getAllServers(Pageable pageable, String search);

    /**
     * Delete a server (admin can delete any server)
     */
    void deleteServer(Long serverId, String adminUsername);

    /**
     * Get system statistics
     */
    Map<String, Object> getSystemStats();

    /**
     * Get online user count
     */
    long getOnlineUserCount();
}
