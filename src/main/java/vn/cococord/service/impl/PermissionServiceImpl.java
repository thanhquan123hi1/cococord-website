package vn.cococord.service.impl;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.entity.mysql.Server;
import vn.cococord.repository.IRolePermissionRepository;
import vn.cococord.repository.IServerMemberRepository;
import vn.cococord.repository.IServerRepository;
import vn.cococord.service.IPermissionService;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PermissionServiceImpl implements IPermissionService {
    
    private final IRolePermissionRepository rolePermissionRepository;
    private final IServerMemberRepository serverMemberRepository;
    private final IServerRepository serverRepository;
    
    // Special permissions
    private static final String ADMINISTRATOR = "ADMINISTRATOR";
    
    @Override
    public boolean hasPermission(Long userId, Long serverId, String permissionName) {
        if (userId == null || serverId == null || permissionName == null) {
            return false;
        }
        
        // Server owner has all permissions
        if (isServerOwner(userId, serverId)) {
            log.debug("User {} is owner of server {}, granting permission {}", userId, serverId, permissionName);
            return true;
        }
        
        // Check if user is administrator
        if (isAdministrator(userId, serverId)) {
            log.debug("User {} is administrator in server {}, granting permission {}", userId, serverId, permissionName);
            return true;
        }
        
        // Check specific permission
        boolean hasPermission = rolePermissionRepository.hasPermission(userId, serverId, permissionName);
        log.debug("User {} has permission {} in server {}: {}", userId, permissionName, serverId, hasPermission);
        return hasPermission;
    }
    
    @Override
    public boolean hasAnyPermission(Long userId, Long serverId, String... permissionNames) {
        if (userId == null || serverId == null || permissionNames == null || permissionNames.length == 0) {
            return false;
        }
        
        // Server owner has all permissions
        if (isServerOwner(userId, serverId)) {
            return true;
        }
        
        // Check if user is administrator
        if (isAdministrator(userId, serverId)) {
            return true;
        }
        
        // Get user's permissions and check if any match
        Set<String> userPermissions = getUserPermissions(userId, serverId);
        for (String permissionName : permissionNames) {
            if (userPermissions.contains(permissionName)) {
                return true;
            }
        }
        return false;
    }
    
    @Override
    public boolean hasAllPermissions(Long userId, Long serverId, String... permissionNames) {
        if (userId == null || serverId == null || permissionNames == null || permissionNames.length == 0) {
            return false;
        }
        
        // Server owner has all permissions
        if (isServerOwner(userId, serverId)) {
            return true;
        }
        
        // Check if user is administrator
        if (isAdministrator(userId, serverId)) {
            return true;
        }
        
        // Get user's permissions and check if all match
        Set<String> userPermissions = getUserPermissions(userId, serverId);
        Set<String> requiredPermissions = new HashSet<>(Arrays.asList(permissionNames));
        return userPermissions.containsAll(requiredPermissions);
    }
    
    @Override
    public Set<String> getUserPermissions(Long userId, Long serverId) {
        if (userId == null || serverId == null) {
            return Collections.emptySet();
        }
        
        // Server owner has all permissions - return a special set
        if (isServerOwner(userId, serverId)) {
            Set<String> allPermissions = new HashSet<>();
            allPermissions.add("ALL_PERMISSIONS"); // Special marker
            return allPermissions;
        }
        
        return rolePermissionRepository.findPermissionNamesByUserIdAndServerId(userId, serverId);
    }
    
    @Override
    public boolean isServerOwner(Long userId, Long serverId) {
        if (userId == null || serverId == null) {
            return false;
        }
        
        Optional<Server> serverOpt = serverRepository.findById(serverId);
        if (serverOpt.isEmpty()) {
            return false;
        }
        
        Server server = serverOpt.get();
        return server.getOwner() != null && userId.equals(server.getOwner().getId());
    }
    
    @Override
    public boolean isAdministrator(Long userId, Long serverId) {
        if (userId == null || serverId == null) {
            return false;
        }
        
        // Server owner is always administrator
        if (isServerOwner(userId, serverId)) {
            return true;
        }
        
        // Check for ADMINISTRATOR permission
        return rolePermissionRepository.hasPermission(userId, serverId, ADMINISTRATOR);
    }
    
    @Override
    public boolean isMember(Long userId, Long serverId) {
        if (userId == null || serverId == null) {
            return false;
        }
        return serverMemberRepository.existsByServerIdAndUserId(serverId, userId);
    }
    
    @Override
    public boolean canManageMessages(Long userId, Long serverId) {
        return hasPermission(userId, serverId, "MANAGE_MESSAGES");
    }
    
    @Override
    public boolean canKickMembers(Long userId, Long serverId) {
        return hasPermission(userId, serverId, "KICK_MEMBERS");
    }
    
    @Override
    public boolean canBanMembers(Long userId, Long serverId) {
        return hasPermission(userId, serverId, "BAN_MEMBERS");
    }
    
    @Override
    public boolean canManageChannels(Long userId, Long serverId) {
        return hasPermission(userId, serverId, "MANAGE_CHANNELS");
    }
    
    @Override
    public boolean canManageRoles(Long userId, Long serverId) {
        return hasPermission(userId, serverId, "MANAGE_ROLES");
    }
    
    @Override
    public boolean canManageServer(Long userId, Long serverId) {
        return hasPermission(userId, serverId, "MANAGE_SERVER");
    }
}
