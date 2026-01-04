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
import vn.cococord.dto.response.MessageResponse;
import vn.cococord.dto.response.ServerResponse;
import vn.cococord.dto.response.UserProfileResponse;
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

    // ================== User Management ==================

    @GetMapping("/users")
    public ResponseEntity<Page<UserProfileResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(adminService.getAllUsers(pageable, search));
    }

    @PostMapping("/users/{userId}/ban")
    public ResponseEntity<MessageResponse> banUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.banUser(userId, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("User banned successfully"));
    }

    @PostMapping("/users/{userId}/unban")
    public ResponseEntity<MessageResponse> unbanUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.unbanUser(userId, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("User unbanned successfully"));
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

    @DeleteMapping("/servers/{serverId}")
    public ResponseEntity<MessageResponse> deleteServer(
            @PathVariable Long serverId,
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.deleteServer(serverId, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Server deleted successfully"));
    }

    // ================== Statistics ==================

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSystemStats() {
        return ResponseEntity.ok(adminService.getSystemStats());
    }

    @GetMapping("/stats/online")
    public ResponseEntity<Map<String, Long>> getOnlineCount() {
        return ResponseEntity.ok(Map.of("onlineUsers", adminService.getOnlineUserCount()));
    }
}
