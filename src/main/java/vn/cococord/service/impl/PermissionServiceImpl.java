package vn.cococord.service.impl;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.permission.ChannelPermissionDTO;
import vn.cococord.dto.permission.ComputedPermissionsDTO;
import vn.cococord.entity.mysql.Channel;
import vn.cococord.entity.mysql.ChannelPermission;
import vn.cococord.entity.mysql.PermissionBit;
import vn.cococord.entity.mysql.Server;
import vn.cococord.entity.mysql.ServerMember;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.repository.IChannelPermissionRepository;
import vn.cococord.repository.IChannelRepository;
import vn.cococord.repository.IRolePermissionRepository;
import vn.cococord.repository.IRoleRepository;
import vn.cococord.repository.IServerMemberRepository;
import vn.cococord.repository.IServerRepository;
import vn.cococord.repository.IUserRepository;
import vn.cococord.service.IPermissionService;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PermissionServiceImpl implements IPermissionService {

    private final IRolePermissionRepository rolePermissionRepository;
    private final IServerMemberRepository serverMemberRepository;
    private final IServerRepository serverRepository;
    private final IChannelRepository channelRepository;
    private final IChannelPermissionRepository channelPermissionRepository;
    private final IRoleRepository roleRepository;
    private final IUserRepository userRepository;
    private final vn.cococord.repository.IPermissionRepository permissionRepository;

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
            log.debug("User {} is administrator in server {}, granting permission {}", userId, serverId,
                    permissionName);
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

    // ===== CHANNEL-LEVEL PERMISSIONS (NEW IMPLEMENTATION) =====

    @Override
    public ComputedPermissionsDTO computeChannelPermissions(Long userId, Long channelId) {
        log.debug("Computing channel permissions for user {} in channel {}", userId, channelId);

        // Validate inputs
        if (userId == null || channelId == null) {
            log.warn("Invalid inputs: userId={}, channelId={}", userId, channelId);
            return ComputedPermissionsDTO.builder()
                    .userId(userId)
                    .channelId(channelId)
                    .finalBitmask(0L)
                    .build();
        }

        // Get channel and server
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found: " + channelId));

        Server server = channel.getServer();
        Long serverId = server.getId();

        // Check if user is server owner - bypass all permissions
        boolean isOwner = isServerOwner(userId, serverId);
        if (isOwner) {
            log.debug("User {} is server owner, granting all permissions", userId);
            ComputedPermissionsDTO result = ComputedPermissionsDTO.builder()
                    .userId(userId)
                    .channelId(channelId)
                    .finalBitmask(PermissionBit.getAllPermissions())
                    .isServerOwner(true)
                    .isAdministrator(true)
                    .build();
            result.populateFromBitmask();
            return result;
        }

        // Check if user is member
        if (!isMember(userId, serverId)) {
            log.debug("User {} is not a member of server {}", userId, serverId);
            return ComputedPermissionsDTO.builder()
                    .userId(userId)
                    .channelId(channelId)
                    .finalBitmask(0L)
                    .build();
        }

        // Get user's roles in the server
        List<ServerMember> memberships = serverMemberRepository.findByServerIdAndUserId(serverId, userId)
                .map(List::of)
                .orElse(Collections.emptyList());
        List<Long> roleIds = memberships.stream()
                .filter(m -> m.getRole() != null)
                .map(m -> m.getRole().getId())
                .collect(Collectors.toList());

        log.debug("User {} has roles {} in server {}", userId, roleIds, serverId);

        // STEP 1: Get base permissions from server roles
        long baseBitmask = getBaseServerPermissions(userId, serverId);
        log.debug("Base server permissions bitmask for user {}: {}", userId, Long.toBinaryString(baseBitmask));

        // If user has ADMINISTRATOR permission at server level, grant all permissions
        if (PermissionBit.ADMINISTRATOR.isSet(baseBitmask)) {
            log.debug("User {} has ADMINISTRATOR permission, granting all permissions", userId);
            ComputedPermissionsDTO result = ComputedPermissionsDTO.builder()
                    .userId(userId)
                    .channelId(channelId)
                    .finalBitmask(PermissionBit.getAllPermissions())
                    .isAdministrator(true)
                    .build();
            result.populateFromBitmask();
            return result;
        }

        // STEP 2: Get channel permission overrides
        List<ChannelPermission> overrides = channelPermissionRepository
                .findByChannelIdAndUserIdOrRoleIds(channelId, userId, roleIds.isEmpty() ? List.of(-1L) : roleIds);

        log.debug("Found {} permission overrides for channel {}", overrides.size(), channelId);

        // Separate role and user overrides
        List<ChannelPermission> roleOverrides = overrides.stream()
                .filter(ChannelPermission::isRoleOverride)
                .collect(Collectors.toList());

        Optional<ChannelPermission> userOverride = overrides.stream()
                .filter(ChannelPermission::isUserOverride)
                .findFirst();

        // STEP 3: Apply role-based overrides (Deny first, then Allow)
        long currentBitmask = baseBitmask;

        // Apply role DENY overrides
        for (ChannelPermission roleOverride : roleOverrides) {
            currentBitmask &= ~roleOverride.getDenyBitmask();
            log.debug("Applied role {} deny override: {}", roleOverride.getTargetId(),
                    Long.toBinaryString(roleOverride.getDenyBitmask()));
        }

        // Apply role ALLOW overrides
        for (ChannelPermission roleOverride : roleOverrides) {
            currentBitmask |= roleOverride.getAllowBitmask();
            log.debug("Applied role {} allow override: {}", roleOverride.getTargetId(),
                    Long.toBinaryString(roleOverride.getAllowBitmask()));
        }

        // STEP 4: Apply user-specific overrides (highest priority)
        if (userOverride.isPresent()) {
            ChannelPermission userPerm = userOverride.get();

            // User DENY overrides everything
            currentBitmask &= ~userPerm.getDenyBitmask();
            log.debug("Applied user {} deny override: {}", userId,
                    Long.toBinaryString(userPerm.getDenyBitmask()));

            // User ALLOW overrides everything
            currentBitmask |= userPerm.getAllowBitmask();
            log.debug("Applied user {} allow override: {}", userId,
                    Long.toBinaryString(userPerm.getAllowBitmask()));
        }

        log.debug("Final permissions bitmask for user {} in channel {}: {}",
                userId, channelId, Long.toBinaryString(currentBitmask));

        // Build result DTO
        ComputedPermissionsDTO result = ComputedPermissionsDTO.builder()
                .userId(userId)
                .channelId(channelId)
                .finalBitmask(currentBitmask)
                .isServerOwner(false)
                .isAdministrator(false)
                .build();

        result.populateFromBitmask();
        return result;
    }

    /**
     * Helper: Get base server permissions from user's roles
     * If user has no role permissions, grant default basic permissions
     */
    private long getBaseServerPermissions(Long userId, Long serverId) {
        // Get all permission names from server roles
        Set<String> permissionNames = getUserPermissions(userId, serverId);

        // If user has "ALL_PERMISSIONS" special marker (server owner)
        if (permissionNames.contains("ALL_PERMISSIONS")) {
            return PermissionBit.getAllPermissions();
        }

        // Convert to bitmask
        long bitmask = 0L;
        for (String permName : permissionNames) {
            PermissionBit bit = PermissionBit.fromName(permName);
            if (bit != null) {
                bitmask |= bit.getValue();
            }
        }

        // IMPORTANT: If user is a member but has no explicit permissions from roles,
        // grant default basic permissions (VIEW_CHANNEL, SEND_MESSAGES,
        // READ_MESSAGE_HISTORY)
        // This prevents new users from being locked out of basic channel access
        if (bitmask == 0L) {
            log.debug("User {} has no role permissions in server {}, granting default basic permissions", userId,
                    serverId);
            bitmask = PermissionBit.VIEW_CHANNEL.getValue()
                    | PermissionBit.SEND_MESSAGES.getValue()
                    | PermissionBit.READ_MESSAGE_HISTORY.getValue()
                    | PermissionBit.EMBED_LINKS.getValue()
                    | PermissionBit.ATTACH_FILES.getValue()
                    | PermissionBit.ADD_REACTIONS.getValue();
        }

        return bitmask;
    }

    @Override
    public boolean hasChannelPermission(Long userId, Long channelId, PermissionBit permissionBit) {
        ComputedPermissionsDTO permissions = computeChannelPermissions(userId, channelId);
        return permissionBit.isSet(permissions.getFinalBitmask());
    }

    @Override
    public boolean hasChannelPermission(Long userId, Long channelId, String permissionName) {
        PermissionBit bit = PermissionBit.fromName(permissionName);
        if (bit == null) {
            log.warn("Unknown permission name: {}", permissionName);
            return false;
        }
        return hasChannelPermission(userId, channelId, bit);
    }

    @Override
    public boolean canViewChannel(Long userId, Long channelId) {
        return hasChannelPermission(userId, channelId, PermissionBit.VIEW_CHANNEL);
    }

    @Override
    public boolean canSendMessagesInChannel(Long userId, Long channelId) {
        return hasChannelPermission(userId, channelId, PermissionBit.SEND_MESSAGES);
    }

    @Override
    public boolean canManageMessagesInChannel(Long userId, Long channelId) {
        return hasChannelPermission(userId, channelId, PermissionBit.MANAGE_MESSAGES);
    }

    @Override
    public boolean canConnectToVoiceChannel(Long userId, Long channelId) {
        return hasChannelPermission(userId, channelId, PermissionBit.CONNECT);
    }

    @Override
    public boolean canSpeakInVoiceChannel(Long userId, Long channelId) {
        return hasChannelPermission(userId, channelId, PermissionBit.SPEAK);
    }

    @Override
    public List<ChannelPermissionDTO> getChannelPermissionOverrides(Long channelId) {
        List<ChannelPermission> overrides = channelPermissionRepository.findByChannel_Id(channelId);

        return overrides.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ChannelPermissionDTO setUserChannelPermissions(Long channelId, Long userId,
            Set<String> allowedPermissions,
            Set<String> deniedPermissions) {
        log.debug("Setting user {} permissions in channel {}: allow={}, deny={}",
                userId, channelId, allowedPermissions, deniedPermissions);

        // Validate channel exists
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found: " + channelId));

        // Validate user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Get or create permission override - USE UNDERSCORE METHOD EXPLICITLY
        log.debug("Looking up existing permission for channel={}, user={}", channelId, userId);
        Optional<ChannelPermission> existingOpt = channelPermissionRepository
                .findByChannel_IdAndTargetTypeAndTargetId(channelId, ChannelPermission.TargetType.USER, userId);

        log.debug("Existing permission found: {}", existingOpt.isPresent());

        ChannelPermission permission;
        if (existingOpt.isPresent()) {
            permission = existingOpt.get();
            log.debug("Updating existing permission ID={}", permission.getId());
        } else {
            permission = ChannelPermission.builder()
                    .channel(channel)
                    .targetType(ChannelPermission.TargetType.USER)
                    .targetId(userId)
                    .allowBitmask(0L)
                    .denyBitmask(0L)
                    .build();
            log.debug("Creating new permission for channel={}, user={}", channelId, userId);
        }

        // Convert permission names to bitmasks
        long allowBitmask = convertPermissionsToBitmask(allowedPermissions);
        long denyBitmask = convertPermissionsToBitmask(deniedPermissions);

        permission.setAllowBitmask(allowBitmask);
        permission.setDenyBitmask(denyBitmask);

        try {
            permission = channelPermissionRepository.save(permission);
            log.info("Updated user {} permissions in channel {}, permission ID={}", userId, channelId,
                    permission.getId());
        } catch (Exception e) {
            log.error("Failed to save permission for channel={}, user={}: {}", channelId, userId, e.getMessage(), e);
            throw e;
        }

        return convertToDTO(permission);
    }

    @Override
    @Transactional
    public ChannelPermissionDTO setRoleChannelPermissions(Long channelId, Long roleId,
            Set<String> allowedPermissions,
            Set<String> deniedPermissions) {
        log.debug("Setting role {} permissions in channel {}: allow={}, deny={}",
                roleId, channelId, allowedPermissions, deniedPermissions);

        // Validate channel exists
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found: " + channelId));

        // Validate role exists
        roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleId));

        // Get or create permission override - USE UNDERSCORE METHOD EXPLICITLY
        log.debug("Looking up existing permission for channel={}, role={}", channelId, roleId);
        Optional<ChannelPermission> existingOpt = channelPermissionRepository
                .findByChannel_IdAndTargetTypeAndTargetId(channelId, ChannelPermission.TargetType.ROLE, roleId);

        log.debug("Existing permission found: {}", existingOpt.isPresent());

        ChannelPermission permission;
        if (existingOpt.isPresent()) {
            permission = existingOpt.get();
            log.debug("Updating existing permission ID={}", permission.getId());
        } else {
            permission = ChannelPermission.builder()
                    .channel(channel)
                    .targetType(ChannelPermission.TargetType.ROLE)
                    .targetId(roleId)
                    .allowBitmask(0L)
                    .denyBitmask(0L)
                    .build();
            log.debug("Creating new permission for channel={}, role={}", channelId, roleId);
        }

        // Convert permission names to bitmasks
        long allowBitmask = convertPermissionsToBitmask(allowedPermissions);
        long denyBitmask = convertPermissionsToBitmask(deniedPermissions);

        permission.setAllowBitmask(allowBitmask);
        permission.setDenyBitmask(denyBitmask);

        try {
            permission = channelPermissionRepository.save(permission);
            log.info("Updated role {} permissions in channel {}, permission ID={}", roleId, channelId,
                    permission.getId());
        } catch (Exception e) {
            log.error("Failed to save permission for channel={}, role={}: {}", channelId, roleId, e.getMessage(), e);
            throw e;
        }

        return convertToDTO(permission);
    }

    @Override
    @Transactional
    public void removeUserChannelPermissions(Long channelId, Long userId) {
        log.debug("Removing user {} permissions from channel {}", userId, channelId);
        channelPermissionRepository.deleteByChannel_IdAndTargetTypeAndTargetId(
                channelId, ChannelPermission.TargetType.USER, userId);
        log.info("Removed user {} permissions from channel {}", userId, channelId);
    }

    @Override
    @Transactional
    public void removeRoleChannelPermissions(Long channelId, Long roleId) {
        log.debug("Removing role {} permissions from channel {}", roleId, channelId);
        channelPermissionRepository.deleteByChannel_IdAndTargetTypeAndTargetId(
                channelId, ChannelPermission.TargetType.ROLE, roleId);
        log.info("Removed role {} permissions from channel {}", roleId, channelId);
    }

    // ===== HELPER METHODS =====

    /**
     * Convert Set<String> permission names to bitmask
     * Enhanced with debug logging and robust matching
     */
    private long convertPermissionsToBitmask(Set<String> permissionNames) {
        if (permissionNames == null || permissionNames.isEmpty()) {
            log.debug("convertPermissionsToBitmask: Input is null or empty, returning 0");
            return 0L;
        }

        log.info("convertPermissionsToBitmask: Processing {} permissions: {}", permissionNames.size(), permissionNames);

        long bitmask = 0L;
        for (String permName : permissionNames) {
            log.debug("  Processing permission string: '{}'", permName);

            PermissionBit bit = null;

            // Strategy 1: Try fromName (case-sensitive match on name field)
            bit = PermissionBit.fromName(permName);

            // Strategy 2: Try valueOf (matches enum constant name)
            if (bit == null) {
                try {
                    bit = PermissionBit.valueOf(permName.toUpperCase().trim());
                    log.debug("    Found via valueOf: {}", bit);
                } catch (IllegalArgumentException e) {
                    // Not found via valueOf either
                }
            }

            // Strategy 3: Try case-insensitive fromName
            if (bit == null) {
                for (PermissionBit b : PermissionBit.values()) {
                    if (b.getName().equalsIgnoreCase(permName.trim())) {
                        bit = b;
                        log.debug("    Found via case-insensitive match: {}", bit);
                        break;
                    }
                }
            }

            if (bit != null) {
                bitmask |= bit.getValue();
                log.debug("    ✅ Matched '{}' -> {} (value: {})", permName, bit.name(), bit.getValue());
            } else {
                log.warn("    ❌ Permission Name Mismatch: Frontend sent '{}' but no matching PermissionBit found!",
                        permName);
            }
        }

        log.info("convertPermissionsToBitmask: Final bitmask = {} (binary: {})", bitmask, Long.toBinaryString(bitmask));
        return bitmask;
    }

    /**
     * Convert ChannelPermission entity to DTO
     */
    private ChannelPermissionDTO convertToDTO(ChannelPermission permission) {
        ChannelPermissionDTO dto = ChannelPermissionDTO.builder()
                .id(permission.getId())
                .channelId(permission.getChannel().getId())
                .targetType(permission.getTargetType())
                .targetId(permission.getTargetId())
                .build();

        // Convert bitmasks to permission names
        dto.fromBitmasks(permission.getAllowBitmask(), permission.getDenyBitmask());

        // Populate target name/avatar/color for display
        if (permission.isUserOverride()) {
            userRepository.findById(permission.getTargetId()).ifPresent(user -> {
                dto.setTargetName(user.getDisplayName() != null ? user.getDisplayName() : user.getUsername());
                dto.setAvatarUrl(user.getAvatarUrl());
            });
        } else if (permission.isRoleOverride()) {
            roleRepository.findById(permission.getTargetId()).ifPresent(role -> {
                dto.setTargetName(role.getName());
                dto.setColor(role.getColor());
            });
        }

        return dto;
    }

    // ===== ROLE PERMISSION MANAGEMENT =====

    @Override
    @Transactional
    public void grantAllPermissionsToRole(Long roleId) {
        vn.cococord.entity.mysql.Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleId));

        // Get all permissions from database
        List<vn.cococord.entity.mysql.Permission> allPermissions = permissionRepository.findAll();

        // Delete existing role permissions
        rolePermissionRepository.deleteByRoleId(roleId);

        // Grant all permissions
        for (vn.cococord.entity.mysql.Permission permission : allPermissions) {
            vn.cococord.entity.mysql.RolePermission rolePermission = vn.cococord.entity.mysql.RolePermission.builder()
                    .role(role)
                    .permission(permission)
                    .isAllowed(true)
                    .build();
            rolePermissionRepository.save(rolePermission);
        }

        log.info("Granted all permissions to role {}", role.getName());
    }

    @Override
    @Transactional
    public void grantPermissionsToRole(Long roleId, Set<String> permissionNames) {
        vn.cococord.entity.mysql.Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleId));

        for (String permissionName : permissionNames) {
            vn.cococord.entity.mysql.Permission permission = permissionRepository.findByName(permissionName)
                    .orElse(null);

            if (permission != null) {
                // Check if already exists
                boolean exists = rolePermissionRepository.findByRoleId(roleId).stream()
                        .anyMatch(rp -> rp.getPermission().getId().equals(permission.getId()));

                if (!exists) {
                    vn.cococord.entity.mysql.RolePermission rolePermission = vn.cococord.entity.mysql.RolePermission
                            .builder()
                            .role(role)
                            .permission(permission)
                            .isAllowed(true)
                            .build();
                    rolePermissionRepository.save(rolePermission);
                }
            } else {
                log.warn("Permission not found: {}", permissionName);
            }
        }

        log.info("Granted permissions {} to role {}", permissionNames, role.getName());
    }

    @Override
    @Transactional
    public void revokeAllPermissionsFromRole(Long roleId) {
        rolePermissionRepository.deleteByRoleId(roleId);
        log.info("Revoked all permissions from role {}", roleId);
    }
}
