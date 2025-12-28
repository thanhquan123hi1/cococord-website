package vn.cococord.service;

import java.util.Set;

/**
 * Service interface for checking user permissions in servers
 */
public interface IPermissionService {
    
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
    
    // Convenience methods for common permission checks
    
    boolean canManageMessages(Long userId, Long serverId);
    
    boolean canKickMembers(Long userId, Long serverId);
    
    boolean canBanMembers(Long userId, Long serverId);
    
    boolean canManageChannels(Long userId, Long serverId);
    
    boolean canManageRoles(Long userId, Long serverId);
    
    boolean canManageServer(Long userId, Long serverId);
}
