package vn.cococord.controller;

import java.util.List;
import java.util.Set;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.annotation.CheckChannelAccess;
import vn.cococord.dto.permission.ChannelPermissionDTO;
import vn.cococord.dto.permission.ComputedPermissionsDTO;
import vn.cococord.service.IPermissionService;

/**
 * REST Controller cho quản lý Channel Permissions
 * 
 * Endpoints:
 * - GET /api/channels/{channelId}/permissions - Lấy tất cả permission overrides
 * - GET /api/channels/{channelId}/permissions/me - Lấy computed permissions của user hiện tại
 * - PUT /api/channels/{channelId}/permissions/users/{userId} - Set user permission overrides
 * - PUT /api/channels/{channelId}/permissions/roles/{roleId} - Set role permission overrides
 * - DELETE /api/channels/{channelId}/permissions/users/{userId} - Xóa user permission overrides
 * - DELETE /api/channels/{channelId}/permissions/roles/{roleId} - Xóa role permission overrides
 */
@RestController
@RequestMapping("/api/channels/{channelId}/permissions")
@RequiredArgsConstructor
@Slf4j
public class ChannelPermissionController {
    
    private final IPermissionService permissionService;
    
    /**
     * Lấy tất cả permission overrides của channel
     * Chỉ admin và owner mới có quyền xem
     */
    @GetMapping
    @CheckChannelAccess(
        permission = "MANAGE_CHANNELS",
        channelIdParam = "channelId",
        message = "Bạn cần quyền 'Quản lý kênh' để xem permission overrides"
    )
    public ResponseEntity<List<ChannelPermissionDTO>> getChannelPermissions(@PathVariable Long channelId) {
        log.info("Getting permission overrides for channel {}", channelId);
        List<ChannelPermissionDTO> permissions = permissionService.getChannelPermissionOverrides(channelId);
        return ResponseEntity.ok(permissions);
    }
    
    /**
     * Lấy computed permissions của user hiện tại trong channel
     * Endpoint này dùng để client kiểm tra xem user có quyền gì
     */
    @GetMapping("/me")
    @CheckChannelAccess(
        permission = "VIEW_CHANNEL",
        channelIdParam = "channelId"
    )
    public ResponseEntity<ComputedPermissionsDTO> getMyPermissions(
            @PathVariable Long channelId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        log.info("User {} requested their permissions in channel {}", userDetails.getUsername(), channelId);
        
        // Get user ID from UserDetails (simplified - adapt to your auth system)
        Long userId = 1L; // TODO: Get from authenticated user
        
        ComputedPermissionsDTO permissions = permissionService.computeChannelPermissions(userId, channelId);
        return ResponseEntity.ok(permissions);
    }
    
    /**
     * Set permission overrides cho một User trong channel
     * Request body:
     * {
     *   "allowedPermissions": ["SEND_MESSAGES", "ADD_REACTIONS"],
     *   "deniedPermissions": ["MENTION_EVERYONE"]
     * }
     */
    @PutMapping("/users/{userId}")
    @CheckChannelAccess(
        permission = "MANAGE_CHANNELS",
        channelIdParam = "channelId",
        message = "Bạn cần quyền 'Quản lý kênh' để thay đổi permissions"
    )
    public ResponseEntity<ChannelPermissionDTO> setUserPermissions(
            @PathVariable Long channelId,
            @PathVariable Long userId,
            @RequestBody SetPermissionsRequest request) {
        
        log.info("Setting user {} permissions in channel {}: allow={}, deny={}", 
                 userId, channelId, request.getAllowedPermissions(), request.getDeniedPermissions());
        
        ChannelPermissionDTO result = permissionService.setUserChannelPermissions(
            channelId, userId, request.getAllowedPermissions(), request.getDeniedPermissions()
        );
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * Set permission overrides cho một Role trong channel
     * Request body: { "allowedPermissions": [...], "deniedPermissions": [...] }
     */
    @PutMapping("/roles/{roleId}")
    @CheckChannelAccess(
        permission = "MANAGE_CHANNELS",
        channelIdParam = "channelId",
        message = "Bạn cần quyền 'Quản lý kênh' để thay đổi permissions"
    )
    public ResponseEntity<ChannelPermissionDTO> setRolePermissions(
            @PathVariable Long channelId,
            @PathVariable Long roleId,
            @RequestBody SetPermissionsRequest request) {
        
        log.info("Setting role {} permissions in channel {}: allow={}, deny={}", 
                 roleId, channelId, request.getAllowedPermissions(), request.getDeniedPermissions());
        
        ChannelPermissionDTO result = permissionService.setRoleChannelPermissions(
            channelId, roleId, request.getAllowedPermissions(), request.getDeniedPermissions()
        );
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * Xóa permission overrides của một User (reset về default)
     */
    @DeleteMapping("/users/{userId}")
    @CheckChannelAccess(
        permission = "MANAGE_CHANNELS",
        channelIdParam = "channelId"
    )
    public ResponseEntity<Void> removeUserPermissions(
            @PathVariable Long channelId,
            @PathVariable Long userId) {
        
        log.info("Removing user {} permission overrides from channel {}", userId, channelId);
        permissionService.removeUserChannelPermissions(channelId, userId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Xóa permission overrides của một Role (reset về default)
     */
    @DeleteMapping("/roles/{roleId}")
    @CheckChannelAccess(
        permission = "MANAGE_CHANNELS",
        channelIdParam = "channelId"
    )
    public ResponseEntity<Void> removeRolePermissions(
            @PathVariable Long channelId,
            @PathVariable Long roleId) {
        
        log.info("Removing role {} permission overrides from channel {}", roleId, channelId);
        permissionService.removeRoleChannelPermissions(channelId, roleId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * DTO cho request body của set permissions endpoints
     */
    @lombok.Data
    public static class SetPermissionsRequest {
        private Set<String> allowedPermissions;
        private Set<String> deniedPermissions;
    }
}
