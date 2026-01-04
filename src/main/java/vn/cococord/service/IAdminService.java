package vn.cococord.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.cococord.dto.request.AdminReportActionRequest;
import vn.cococord.dto.request.AdminRoleRequest;
import vn.cococord.dto.request.AdminSettingsRequest;
import vn.cococord.dto.response.*;
import vn.cococord.entity.mysql.AdminAuditLog;

import java.util.Map;

public interface IAdminService {

    // ================== Dashboard ==================

    /**
     * Get dashboard summary statistics
     */
    AdminDashboardResponse getDashboardSummary();

    /**
     * Get detailed statistics for charts
     */
    AdminStatsResponse getDetailedStats(String period);

    // ================== User Management ==================

    /**
     * Get all users with pagination and filters
     * 
     * @param pageable pagination info
     * @param search   search term (username or email)
     * @param status   filter by status (active, banned, muted, inactive)
     * @param role     filter by role (USER, MODERATOR, ADMIN)
     */
    Page<UserProfileResponse> getAllUsers(Pageable pageable, String search, String status, String role);

    /**
     * Get user by ID
     */
    UserProfileResponse getUserById(Long userId);

    /**
     * Ban a user from the system
     * 
     * @param userId        user to ban
     * @param reason        ban reason
     * @param duration      ban duration (e.g., "1h", "24h", "7d", "30d",
     *                      "permanent")
     * @param adminUsername admin performing the action
     */
    void banUser(Long userId, String reason, String duration, String adminUsername);

    /**
     * Unban a user
     */
    void unbanUser(Long userId, String adminUsername);

    /**
     * Mute a user
     */
    void muteUser(Long userId, String reason, Integer durationMinutes, String adminUsername);

    /**
     * Unmute a user
     */
    void unmuteUser(Long userId, String adminUsername);

    /**
     * Update user role
     */
    void updateUserRole(Long userId, String role, String adminUsername);

    /**
     * Delete a user account
     */
    void deleteUser(Long userId, String adminUsername);

    // ================== Server Management ==================

    /**
     * Get all servers with pagination
     */
    Page<ServerResponse> getAllServers(Pageable pageable, String search);

    /**
     * Get server by ID
     */
    ServerResponse getServerById(Long serverId);

    /**
     * Lock a server
     */
    void lockServer(Long serverId, String reason, String adminUsername);

    /**
     * Unlock a server
     */
    void unlockServer(Long serverId, String adminUsername);

    /**
     * Delete a server (admin can delete any server)
     */
    void deleteServer(Long serverId, String adminUsername);

    // ================== Report Management ==================

    /**
     * Get all reports with pagination
     */
    Page<AdminReportResponse> getAllReports(Pageable pageable, String status, String type);

    /**
     * Get report by ID
     */
    AdminReportResponse getReportById(Long reportId);

    /**
     * Resolve a report
     */
    void resolveReport(Long reportId, AdminReportActionRequest request, String adminUsername);

    /**
     * Reject a report
     */
    void rejectReport(Long reportId, AdminReportActionRequest request, String adminUsername);

    // ================== Message Management ==================

    /**
     * Get recent messages with optional filters
     */
    Page<AdminMessageResponse> getRecentMessages(Pageable pageable, Boolean reported);

    /**
     * Delete a message
     */
    void deleteMessage(String messageId, String adminUsername);

    // ================== Role Management ==================

    /**
     * Get all system roles
     */
    Page<AdminRoleResponse> getAllRoles(Pageable pageable);

    /**
     * Create a new role
     */
    AdminRoleResponse createRole(AdminRoleRequest request, String adminUsername);

    /**
     * Update a role
     */
    AdminRoleResponse updateRole(Long roleId, AdminRoleRequest request, String adminUsername);

    /**
     * Delete a role
     */
    void deleteRole(Long roleId, String adminUsername);

    // ================== Audit Log ==================

    /**
     * Get audit logs with filters
     */
    Page<AdminAuditLogResponse> getAuditLogs(Pageable pageable, String actionType, Long actorId);

    /**
     * Log admin action
     */
    void logAdminAction(AdminAuditLog.AdminActionType actionType, String description,
            String targetType, Long targetId, String targetName,
            String changes, String adminUsername, String ipAddress);

    // ================== Settings ==================

    /**
     * Get all system settings
     */
    AdminSettingsResponse getSettings();

    /**
     * Update system settings
     */
    AdminSettingsResponse updateSettings(AdminSettingsRequest request, String adminUsername);

    // ================== Legacy methods ==================

    /**
     * Get system statistics (legacy)
     */
    Map<String, Object> getSystemStats();

    /**
     * Get online user count
     */
    long getOnlineUserCount();
}
