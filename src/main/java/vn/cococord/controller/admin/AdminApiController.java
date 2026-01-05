package vn.cococord.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import vn.cococord.dto.request.AdminReportActionRequest;
import vn.cococord.dto.request.AdminCreateUserRequest;
import vn.cococord.dto.request.AdminRoleRequest;
import vn.cococord.dto.request.AdminSettingsRequest;
import vn.cococord.dto.response.*;
import vn.cococord.service.IAdminService;

import java.util.Map;

/**
 * Admin API Controller
 * REST endpoints for admin panel operations
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminApiController {

    private final IAdminService adminService;

    // ================== Dashboard ==================

    @GetMapping("/dashboard/summary")
    public ResponseEntity<AdminDashboardResponse> getDashboardSummary() {
        return ResponseEntity.ok(adminService.getDashboardSummary());
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<AdminStatsResponse> getDetailedStats(
            @RequestParam(defaultValue = "week") String period) {
        return ResponseEntity.ok(adminService.getDetailedStats(period));
    }

    // ================== User Management ==================

    @GetMapping("/users")
    public ResponseEntity<Page<UserProfileResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(adminService.getAllUsers(pageable, search, status, role));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<UserProfileResponse> getUserById(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.getUserById(userId));
    }

    @PostMapping("/users")
    public ResponseEntity<UserProfileResponse> createUser(
            @Valid @RequestBody AdminCreateUserRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(adminService.createUser(request, userDetails.getUsername()));
    }

    @PostMapping("/users/{userId}/ban")
    public ResponseEntity<MessageResponse> banUser(
            @PathVariable Long userId,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) String duration,
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.banUser(userId, reason, duration, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("User banned successfully"));
    }

    @PostMapping("/users/{userId}/unban")
    public ResponseEntity<MessageResponse> unbanUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.unbanUser(userId, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("User unbanned successfully"));
    }

    @PostMapping("/users/{userId}/mute")
    public ResponseEntity<MessageResponse> muteUser(
            @PathVariable Long userId,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) Integer duration,
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.muteUser(userId, reason, duration, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("User muted successfully"));
    }

    @PostMapping("/users/{userId}/unmute")
    public ResponseEntity<MessageResponse> unmuteUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.unmuteUser(userId, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("User unmuted successfully"));
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<MessageResponse> updateUserRole(
            @PathVariable Long userId,
            @RequestParam String role,
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.updateUserRole(userId, role, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("User role updated to " + role));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<MessageResponse> deleteUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.deleteUser(userId, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("User deleted successfully"));
    }

    // ================== Server Management ==================

    @GetMapping("/servers")
    public ResponseEntity<Page<ServerResponse>> getAllServers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(adminService.getAllServers(pageable, search));
    }

    @GetMapping("/servers/{serverId}")
    public ResponseEntity<ServerResponse> getServerById(@PathVariable Long serverId) {
        return ResponseEntity.ok(adminService.getServerById(serverId));
    }

    @PostMapping("/servers/{serverId}/lock")
    public ResponseEntity<MessageResponse> lockServer(
            @PathVariable Long serverId,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.lockServer(serverId, reason, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Server locked successfully"));
    }

    @PostMapping("/servers/{serverId}/unlock")
    public ResponseEntity<MessageResponse> unlockServer(
            @PathVariable Long serverId,
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.unlockServer(serverId, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Server unlocked successfully"));
    }

    @DeleteMapping("/servers/{serverId}")
    public ResponseEntity<MessageResponse> deleteServer(
            @PathVariable Long serverId,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.deleteServer(serverId, reason, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Server deleted successfully"));
    }

    @PostMapping("/servers/{serverId}/transfer")
    public ResponseEntity<MessageResponse> transferServerOwnership(
            @PathVariable Long serverId,
            @RequestParam Long newOwnerId,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.transferServerOwnership(serverId, newOwnerId, reason, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Server ownership transferred successfully"));
    }

    @GetMapping("/servers/stats")
    public ResponseEntity<Map<String, Object>> getServerStats() {
        return ResponseEntity.ok(adminService.getServerStats());
    }

    @GetMapping("/servers/{serverId}/audit-log")
    public ResponseEntity<Page<AdminAuditLogResponse>> getServerAuditLog(
            @PathVariable Long serverId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(adminService.getServerAuditLog(serverId, pageable));
    }

    @GetMapping("/servers/{serverId}/reports")
    public ResponseEntity<Page<AdminReportResponse>> getServerReports(
            @PathVariable Long serverId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(adminService.getServerReports(serverId, pageable));
    }

    // ================== Report Management ==================

    @GetMapping("/reports")
    public ResponseEntity<Page<AdminReportResponse>> getAllReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(adminService.getAllReports(pageable, status, type));
    }

    @GetMapping("/reports/{reportId}")
    public ResponseEntity<AdminReportResponse> getReportById(@PathVariable Long reportId) {
        return ResponseEntity.ok(adminService.getReportById(reportId));
    }

    @PostMapping("/reports/{reportId}/resolve")
    public ResponseEntity<MessageResponse> resolveReport(
            @PathVariable Long reportId,
            @RequestBody(required = false) AdminReportActionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.resolveReport(reportId, request != null ? request : new AdminReportActionRequest(),
                userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Report resolved successfully"));
    }

    @PostMapping("/reports/{reportId}/reject")
    public ResponseEntity<MessageResponse> rejectReport(
            @PathVariable Long reportId,
            @RequestBody(required = false) AdminReportActionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.rejectReport(reportId, request != null ? request : new AdminReportActionRequest(),
                userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Report rejected successfully"));
    }

    // ================== Message Management ==================

    @GetMapping("/messages")
    public ResponseEntity<Page<AdminMessageResponse>> getRecentMessages(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) Boolean reported,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(adminService.getRecentMessages(pageable, reported));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<MessageResponse> deleteMessage(
            @PathVariable String messageId,
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.deleteMessage(messageId, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Message deleted successfully"));
    }

    // ================== Role Management ==================

    @GetMapping("/roles")
    public ResponseEntity<Page<AdminRoleResponse>> getAllRoles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(adminService.getAllRoles(pageable));
    }

    @PostMapping("/roles")
    public ResponseEntity<AdminRoleResponse> createRole(
            @RequestBody AdminRoleRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(adminService.createRole(request, userDetails.getUsername()));
    }

    @PutMapping("/roles/{roleId}")
    public ResponseEntity<AdminRoleResponse> updateRole(
            @PathVariable Long roleId,
            @RequestBody AdminRoleRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(adminService.updateRole(roleId, request, userDetails.getUsername()));
    }

    @DeleteMapping("/roles/{roleId}")
    public ResponseEntity<MessageResponse> deleteRole(
            @PathVariable Long roleId,
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.deleteRole(roleId, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Role deleted successfully"));
    }

    // ================== Audit Log ==================

    @GetMapping("/audit-log")
    public ResponseEntity<Page<AdminAuditLogResponse>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) Long actorId,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(adminService.getAuditLogs(pageable, actionType, actorId));
    }

    // ================== Settings ==================

    @GetMapping("/settings")
    public ResponseEntity<AdminSettingsResponse> getSettings() {
        return ResponseEntity.ok(adminService.getSettings());
    }

    @PutMapping("/settings")
    public ResponseEntity<AdminSettingsResponse> updateSettings(
            @RequestBody AdminSettingsRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(adminService.updateSettings(request, userDetails.getUsername()));
    }

    // ================== Statistics (Legacy) ==================

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSystemStats() {
        return ResponseEntity.ok(adminService.getSystemStats());
    }

    @GetMapping("/stats/online")
    public ResponseEntity<Map<String, Long>> getOnlineCount() {
        return ResponseEntity.ok(Map.of("onlineUsers", adminService.getOnlineUserCount()));
    }
}
