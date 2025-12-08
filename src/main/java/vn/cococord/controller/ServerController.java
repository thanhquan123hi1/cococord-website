package vn.cococord.controller;

import vn.cococord.dto.*;
import vn.cococord.entity.*;
import vn.cococord.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/servers")
public class ServerController {
    private final ServerService serverService;
    private final UserService userService;
    private final ServerInviteService inviteService;
    private final ServerBanService banService;
    private final RoleService roleService;
    private final NotificationService notificationService;

    public ServerController(ServerService serverService, UserService userService,
            ServerInviteService inviteService, ServerBanService banService,
            RoleService roleService, NotificationService notificationService) {
        this.serverService = serverService;
        this.userService = userService;
        this.inviteService = inviteService;
        this.banService = banService;
        this.roleService = roleService;
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<ServerDto>> listServers(Principal principal) {
        User user = userService.findByUsername(principal.getName()).orElseThrow();
        List<Server> servers = serverService.listServersOfUser(user);
        List<ServerDto> dtos = servers.stream().map(serverService::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<ServerDto> createServer(@RequestBody Map<String, String> body, Principal principal) {
        String name = body.get("name");
        String description = body.getOrDefault("description", "");
        User user = userService.findByUsername(principal.getName()).orElseThrow();
        Server server = serverService.createServer(user, name, description);
        return ResponseEntity.ok(serverService.toDto(server));
    }

    @GetMapping("/{serverId}")
    public ResponseEntity<ServerDto> getServer(@PathVariable Long serverId, Principal principal) {
        Server server = serverService.findById(serverId)
                .orElseThrow(() -> new RuntimeException("Server not found"));
        return ResponseEntity.ok(serverService.toDto(server));
    }

    @PutMapping("/{serverId}")
    public ResponseEntity<ServerDto> updateServer(
            @PathVariable Long serverId,
            @RequestBody Map<String, String> body,
            Principal principal) {
        User user = userService.findByUsername(principal.getName()).orElseThrow();
        Server server = serverService.updateServer(serverId, body, user);
        return ResponseEntity.ok(serverService.toDto(server));
    }

    @DeleteMapping("/{serverId}")
    public ResponseEntity<?> deleteServer(@PathVariable Long serverId, Principal principal) {
        User user = userService.findByUsername(principal.getName()).orElseThrow();
        serverService.deleteServer(serverId, user);
        return ResponseEntity.ok(Map.of("message", "Server deleted"));
    }

    // ========== Members ==========
    @GetMapping("/{serverId}/members")
    public ResponseEntity<List<ServerMemberDto>> getMembers(@PathVariable Long serverId) {
        Server server = serverService.findById(serverId).orElseThrow();
        return ResponseEntity.ok(serverService.getMembers(server));
    }

    @PostMapping("/{serverId}/members/{userId}/kick")
    public ResponseEntity<?> kickMember(
            @PathVariable Long serverId,
            @PathVariable Long userId,
            Principal principal) {
        User admin = userService.findByUsername(principal.getName()).orElseThrow();
        Server server = serverService.findById(serverId).orElseThrow();
        User targetUser = userService.findById(userId).orElseThrow();

        serverService.verifyPermission(server, admin, "KICK_MEMBERS");
        banService.kickUser(server, targetUser);
        notificationService.sendKickedNotification(targetUser, server);

        return ResponseEntity.ok(Map.of("message", "Member kicked"));
    }

    @PostMapping("/{serverId}/members/{userId}/ban")
    public ResponseEntity<?> banMember(
            @PathVariable Long serverId,
            @PathVariable Long userId,
            @RequestBody(required = false) Map<String, String> body,
            Principal principal) {
        User admin = userService.findByUsername(principal.getName()).orElseThrow();
        Server server = serverService.findById(serverId).orElseThrow();
        User targetUser = userService.findById(userId).orElseThrow();
        String reason = body != null ? body.get("reason") : null;

        serverService.verifyPermission(server, admin, "BAN_MEMBERS");
        banService.banUser(server, targetUser, admin, reason);
        notificationService.sendBannedNotification(targetUser, server);

        return ResponseEntity.ok(Map.of("message", "Member banned"));
    }

    @DeleteMapping("/{serverId}/bans/{userId}")
    public ResponseEntity<?> unbanMember(
            @PathVariable Long serverId,
            @PathVariable Long userId,
            Principal principal) {
        User admin = userService.findByUsername(principal.getName()).orElseThrow();
        Server server = serverService.findById(serverId).orElseThrow();
        User targetUser = userService.findById(userId).orElseThrow();

        serverService.verifyPermission(server, admin, "BAN_MEMBERS");
        banService.unbanUser(server, targetUser);

        return ResponseEntity.ok(Map.of("message", "Member unbanned"));
    }

    @GetMapping("/{serverId}/bans")
    public ResponseEntity<List<ServerBanDto>> getBans(@PathVariable Long serverId, Principal principal) {
        Server server = serverService.findById(serverId).orElseThrow();
        return ResponseEntity.ok(banService.getServerBans(server));
    }

    @PostMapping("/{serverId}/leave")
    public ResponseEntity<?> leaveServer(@PathVariable Long serverId, Principal principal) {
        User user = userService.findByUsername(principal.getName()).orElseThrow();
        serverService.leaveServer(serverId, user);
        return ResponseEntity.ok(Map.of("message", "Left server"));
    }

    // ========== Invites ==========
    @GetMapping("/{serverId}/invites")
    public ResponseEntity<List<ServerInviteDto>> getInvites(@PathVariable Long serverId, Principal principal) {
        Server server = serverService.findById(serverId).orElseThrow();
        return ResponseEntity.ok(inviteService.getServerInvites(server));
    }

    @PostMapping("/{serverId}/invites")
    public ResponseEntity<ServerInviteDto> createInvite(
            @PathVariable Long serverId,
            @RequestBody(required = false) CreateInviteRequest request,
            Principal principal) {
        User user = userService.findByUsername(principal.getName()).orElseThrow();
        Server server = serverService.findById(serverId).orElseThrow();
        ServerInvite invite = inviteService.createInvite(server, user, request);
        return ResponseEntity.ok(inviteService.toDto(invite));
    }

    @DeleteMapping("/{serverId}/invites/{inviteId}")
    public ResponseEntity<?> deleteInvite(
            @PathVariable Long serverId,
            @PathVariable Long inviteId,
            Principal principal) {
        Server server = serverService.findById(serverId).orElseThrow();
        inviteService.deleteInvite(inviteId, server);
        return ResponseEntity.ok(Map.of("message", "Invite deleted"));
    }

    // ========== Roles ==========
    @GetMapping("/{serverId}/roles")
    public ResponseEntity<List<RoleDto>> getRoles(@PathVariable Long serverId) {
        Server server = serverService.findById(serverId).orElseThrow();
        return ResponseEntity.ok(roleService.getServerRoles(server));
    }

    @PostMapping("/{serverId}/roles")
    public ResponseEntity<RoleDto> createRole(
            @PathVariable Long serverId,
            @RequestBody CreateRoleRequest request,
            Principal principal) {
        User user = userService.findByUsername(principal.getName()).orElseThrow();
        Server server = serverService.findById(serverId).orElseThrow();
        serverService.verifyPermission(server, user, "MANAGE_ROLES");
        Role role = roleService.createRole(server, request);
        return ResponseEntity.ok(roleService.toDto(role));
    }

    @PutMapping("/{serverId}/roles/{roleId}")
    public ResponseEntity<RoleDto> updateRole(
            @PathVariable Long serverId,
            @PathVariable Long roleId,
            @RequestBody CreateRoleRequest request,
            Principal principal) {
        User user = userService.findByUsername(principal.getName()).orElseThrow();
        Server server = serverService.findById(serverId).orElseThrow();
        serverService.verifyPermission(server, user, "MANAGE_ROLES");
        Role role = roleService.updateRole(roleId, request);
        return ResponseEntity.ok(roleService.toDto(role));
    }

    @DeleteMapping("/{serverId}/roles/{roleId}")
    public ResponseEntity<?> deleteRole(
            @PathVariable Long serverId,
            @PathVariable Long roleId,
            Principal principal) {
        User user = userService.findByUsername(principal.getName()).orElseThrow();
        Server server = serverService.findById(serverId).orElseThrow();
        serverService.verifyPermission(server, user, "MANAGE_ROLES");
        roleService.deleteRole(roleId);
        return ResponseEntity.ok(Map.of("message", "Role deleted"));
    }
}
