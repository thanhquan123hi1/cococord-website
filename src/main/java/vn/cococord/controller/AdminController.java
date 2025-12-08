package vn.cococord.controller;

import vn.cococord.dto.*;
import vn.cococord.entity.*;
import vn.cococord.service.*;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;
    private final ServerService serverService;
    private final AuditLogService auditLogService;

    public AdminController(UserService userService, ServerService serverService,
            AuditLogService auditLogService) {
        this.userService = userService;
        this.serverService = serverService;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        Map<String, Object> stats = Map.of(
                "totalUsers", userService.countAllUsers(),
                "totalServers", serverService.countAllServers(),
                "onlineUsers", userService.countOnlineUsers(),
                "newUsersToday", userService.countNewUsersToday());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(userService.getAllUsers(page, size, search));
    }

    @PostMapping("/users/{userId}/ban")
    public ResponseEntity<?> banUser(@PathVariable Long userId, @RequestBody Map<String, String> body,
            Principal principal) {
        String reason = body.getOrDefault("reason", "Violation of terms of service");
        User admin = userService.findByUsername(principal.getName()).orElseThrow();
        userService.banUser(userId, reason, admin);
        return ResponseEntity.ok(Map.of("message", "User banned successfully"));
    }

    @PostMapping("/users/{userId}/unban")
    public ResponseEntity<?> unbanUser(@PathVariable Long userId, Principal principal) {
        User admin = userService.findByUsername(principal.getName()).orElseThrow();
        userService.unbanUser(userId, admin);
        return ResponseEntity.ok(Map.of("message", "User unbanned successfully"));
    }

    @GetMapping("/servers")
    public ResponseEntity<?> getAllServers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(serverService.getAllServers(page, size, search));
    }

    @DeleteMapping("/servers/{serverId}")
    public ResponseEntity<?> deleteServer(@PathVariable Long serverId, Principal principal) {
        User admin = userService.findByUsername(principal.getName()).orElseThrow();
        serverService.adminDeleteServer(serverId, admin);
        return ResponseEntity.ok(Map.of("message", "Server deleted successfully"));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<Page<AuditLogDto>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(auditLogService.getAllAuditLogs(page, size));
    }
}
