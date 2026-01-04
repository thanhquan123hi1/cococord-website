package vn.cococord.service;

import java.util.Set;

import vn.cococord.dto.permission.ChannelPermissionDTO;
import vn.cococord.dto.permission.ComputedPermissionsDTO;
import vn.cococord.entity.mysql.PermissionBit;

/**
 * Service interface for checking user permissions in servers and channels
 */
public interface IPermissionService {
    
    // ===== SERVER-LEVEL PERMISSIONS =====
    
    /**
     * Check if user has a specific permission in a server
     * @param userId User ID
     * @param serverId Server ID
     * @param permissionName Permission name (e.g., "MANAGE_MESSAGES")
     * @return true if user has the permission
     */
    boolean hasPermission(Long userId, Long serverId, String permissionName);
    
    /**
     * Check if user has any of the specified permissions in a server
     * @param userId User ID
     * @param serverId Server ID
     * @param permissionNames Array of permission names
     * @return true if user has at least one of the permissions
     */
    boolean hasAnyPermission(Long userId, Long serverId, String... permissionNames);
    
    /**
     * Check if user has all of the specified permissions in a server
     * @param userId User ID
     * @param serverId Server ID
     * @param permissionNames Array of permission names
     * @return true if user has all of the permissions
     */
    boolean hasAllPermissions(Long userId, Long serverId, String... permissionNames);
    
    /**
     * Get all permissions for a user in a server
     * @param userId User ID
     * @param serverId Server ID
     * @return Set of permission names
     */
    Set<String> getUserPermissions(Long userId, Long serverId);
    
    /**
     * Check if user is the server owner
     * @param userId User ID
     * @param serverId Server ID
     * @return true if user is the server owner
     */
    boolean isServerOwner(Long userId, Long serverId);
    
    /**
     * Check if user is an administrator (server owner or has ADMINISTRATOR permission)
     * @param userId User ID
     * @param serverId Server ID
     * @return true if user is an administrator
     */
    boolean isAdministrator(Long userId, Long serverId);
    
    /**
     * Check if user is a member of the server
     * @param userId User ID
     * @param serverId Server ID
     * @return true if user is a member
     */
    boolean isMember(Long userId, Long serverId);
    
    // ===== CHANNEL-LEVEL PERMISSIONS (NEW) =====
    
    /**
     * Tính toán permissions của User trong một Channel cụ thể
     * Logic: Base Server Permissions -> Channel Deny (Roles) -> Channel Allow (Roles) 
     *        -> Channel Deny (User) -> Channel Allow (User)
     * 
     * @param userId User ID
     * @param channelId Channel ID
     * @return ComputedPermissionsDTO chứa final bitmask và các boolean flags
     */
    ComputedPermissionsDTO computeChannelPermissions(Long userId, Long channelId);
    
    /**
     * Kiểm tra xem User có permission cụ thể trong Channel không
     * @param userId User ID
     * @param channelId Channel ID
     * @param permissionBit PermissionBit cần kiểm tra
     * @return true nếu user có permission
     */
    boolean hasChannelPermission(Long userId, Long channelId, PermissionBit permissionBit);
    
    /**
     * Kiểm tra xem User có permission cụ thể trong Channel không (by name)
     * @param userId User ID
     * @param channelId Channel ID
     * @param permissionName Tên permission (e.g., "SEND_MESSAGES")
     * @return true nếu user có permission
     */
    boolean hasChannelPermission(Long userId, Long channelId, String permissionName);
    
    /**
     * Kiểm tra xem User có thể xem Channel không
     * @param userId User ID
     * @param channelId Channel ID
     * @return true nếu user có thể xem channel
     */
    boolean canViewChannel(Long userId, Long channelId);
    
    /**
     * Kiểm tra xem User có thể gửi tin nhắn trong Channel không
     * @param userId User ID
     * @param channelId Channel ID
     * @return true nếu user có thể gửi tin nhắn
     */
    boolean canSendMessagesInChannel(Long userId, Long channelId);
    
    /**
     * Kiểm tra xem User có thể quản lý tin nhắn trong Channel không
     * @param userId User ID
     * @param channelId Channel ID
     * @return true nếu user có thể quản lý tin nhắn
     */
    boolean canManageMessagesInChannel(Long userId, Long channelId);
    
    /**
     * Kiểm tra xem User có thể connect vào Voice Channel không
     * @param userId User ID
     * @param channelId Channel ID
     * @return true nếu user có thể connect
     */
    boolean canConnectToVoiceChannel(Long userId, Long channelId);
    
    /**
     * Kiểm tra xem User có thể nói trong Voice Channel không
     * @param userId User ID
     * @param channelId Channel ID
     * @return true nếu user có thể nói
     */
    boolean canSpeakInVoiceChannel(Long userId, Long channelId);
    
    /**
     * Lấy tất cả permission overrides của một Channel
     * @param channelId Channel ID
     * @return Danh sách ChannelPermissionDTO
     */
    java.util.List<ChannelPermissionDTO> getChannelPermissionOverrides(Long channelId);
    
    /**
     * Tạo hoặc cập nhật permission override cho User trong Channel
     * @param channelId Channel ID
     * @param userId User ID
     * @param allowedPermissions Set các permission được allow
     * @param deniedPermissions Set các permission bị deny
     * @return ChannelPermissionDTO đã được tạo/cập nhật
     */
    ChannelPermissionDTO setUserChannelPermissions(Long channelId, Long userId, 
                                                    Set<String> allowedPermissions, 
                                                    Set<String> deniedPermissions);
    
    /**
     * Tạo hoặc cập nhật permission override cho Role trong Channel
     * @param channelId Channel ID
     * @param roleId Role ID
     * @param allowedPermissions Set các permission được allow
     * @param deniedPermissions Set các permission bị deny
     * @return ChannelPermissionDTO đã được tạo/cập nhật
     */
    ChannelPermissionDTO setRoleChannelPermissions(Long channelId, Long roleId, 
                                                    Set<String> allowedPermissions, 
                                                    Set<String> deniedPermissions);
    
    /**
     * Xóa permission override của User trong Channel
     * @param channelId Channel ID
     * @param userId User ID
     */
    void removeUserChannelPermissions(Long channelId, Long userId);
    
    /**
     * Xóa permission override của Role trong Channel
     * @param channelId Channel ID
     * @param roleId Role ID
     */
    void removeRoleChannelPermissions(Long channelId, Long roleId);
    
    // ===== CONVENIENCE METHODS (SERVER-LEVEL) =====
    
    boolean canManageMessages(Long userId, Long serverId);
    
    boolean canKickMembers(Long userId, Long serverId);
    
    boolean canBanMembers(Long userId, Long serverId);
    
    boolean canManageChannels(Long userId, Long serverId);
    
    boolean canManageRoles(Long userId, Long serverId);
    
    boolean canManageServer(Long userId, Long serverId);
}

