package vn.cococord.controller.user;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.cococord.dto.request.*;
import vn.cococord.dto.response.*;
import vn.cococord.service.IServerService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/servers")
@RequiredArgsConstructor
@Slf4j
public class ServerController {

    private final IServerService serverService;

    /**
     * Get all servers the current user belongs to
     */
    @GetMapping
    public ResponseEntity<List<ServerResponse>> getUserServers(Authentication authentication) {
        String username = authentication.getName();
        List<ServerResponse> servers = serverService.getServersByUsername(username);
        return ResponseEntity.ok(servers);
    }

    /**
     * Get a specific server by ID
     */
    @GetMapping("/{serverId}")
    public ResponseEntity<ServerResponse> getServerById(
            @PathVariable Long serverId,
            Authentication authentication) {
        String username = authentication.getName();
        ServerResponse server = serverService.getServerById(serverId, username);
        return ResponseEntity.ok(server);
    }

    /**
     * Create a new server
     */
    @PostMapping
    public ResponseEntity<ServerResponse> createServer(
            @Valid @RequestBody CreateServerRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        ServerResponse server = serverService.createServer(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(server);
    }

    /**
     * Update server settings
     */
    @PutMapping("/{serverId}")
    public ResponseEntity<ServerResponse> updateServer(
            @PathVariable Long serverId,
            @Valid @RequestBody UpdateServerRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        ServerResponse server = serverService.updateServer(serverId, request, username);
        return ResponseEntity.ok(server);
    }

    /**
     * Delete a server
     */
    @DeleteMapping("/{serverId}")
    public ResponseEntity<Void> deleteServer(
            @PathVariable Long serverId,
            Authentication authentication) {
        String username = authentication.getName();
        serverService.deleteServer(serverId, username);
        return ResponseEntity.noContent().build();
    }

    /**
     * Leave a server
     */
    @PostMapping("/{serverId}/leave")
    public ResponseEntity<Void> leaveServer(
            @PathVariable Long serverId,
            Authentication authentication) {
        String username = authentication.getName();
        serverService.leaveServer(serverId, username);
        return ResponseEntity.noContent().build();
    }

    // ==================== MEMBER MANAGEMENT ====================

    /**
     * Get all members of a server
     */
    @GetMapping("/{serverId}/members")
    public ResponseEntity<List<ServerMemberResponse>> getServerMembers(
            @PathVariable Long serverId,
            Authentication authentication) {
        String username = authentication.getName();
        List<ServerMemberResponse> members = serverService.getServerMembers(serverId, username);
        return ResponseEntity.ok(members);
    }

    /**
     * Kick a member from the server
     */
    @PostMapping("/{serverId}/kick")
    public ResponseEntity<Void> kickMember(
            @PathVariable Long serverId,
            @Valid @RequestBody KickMemberRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        serverService.kickMember(serverId, request, username);
        return ResponseEntity.noContent().build();
    }

    /**
     * Ban a member from the server
     */
    @PostMapping("/{serverId}/ban")
    public ResponseEntity<Void> banMember(
            @PathVariable Long serverId,
            @Valid @RequestBody BanMemberRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        serverService.banMember(serverId, request, username);
        return ResponseEntity.noContent().build();
    }

    /**
     * Unban a member from the server
     */
    @DeleteMapping("/{serverId}/bans/{userId}")
    public ResponseEntity<Void> unbanMember(
            @PathVariable Long serverId,
            @PathVariable Long userId,
            Authentication authentication) {
        String username = authentication.getName();
        serverService.unbanMember(serverId, userId, username);
        return ResponseEntity.noContent().build();
    }

    // ==================== INVITE LINKS ====================

    /**
     * Create an invite link for the server
     */
    @PostMapping("/{serverId}/invites")
    public ResponseEntity<InviteLinkResponse> createInviteLink(
            @PathVariable Long serverId,
            @Valid @RequestBody CreateInviteLinkRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        InviteLinkResponse inviteLink = serverService.createInviteLink(serverId, request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(inviteLink);
    }

    /**
     * Get all invite links for a server
     */
    @GetMapping("/{serverId}/invites")
    public ResponseEntity<List<InviteLinkResponse>> getServerInviteLinks(
            @PathVariable Long serverId,
            Authentication authentication) {
        String username = authentication.getName();
        List<InviteLinkResponse> inviteLinks = serverService.getServerInviteLinks(serverId, username);
        return ResponseEntity.ok(inviteLinks);
    }

    /**
     * Delete an invite link
     */
    @DeleteMapping("/{serverId}/invites/{inviteLinkId}")
    public ResponseEntity<Void> deleteInviteLink(
            @PathVariable Long serverId,
            @PathVariable Long inviteLinkId,
            Authentication authentication) {
        String username = authentication.getName();
        serverService.deleteInviteLink(serverId, inviteLinkId, username);
        return ResponseEntity.noContent().build();
    }

    /**
     * Join server using invite code
     */
    @PostMapping("/join/{code}")
    public ResponseEntity<ServerResponse> joinServerByInvite(
            @PathVariable String code,
            Authentication authentication) {
        String username = authentication.getName();
        ServerResponse server = serverService.joinServerByInvite(code, username);
        return ResponseEntity.ok(server);
    }

    /**
     * Get invite link info by code (public endpoint for preview)
     */
    @GetMapping("/invite/{code}")
    public ResponseEntity<InviteLinkResponse> getInviteLinkByCode(@PathVariable String code) {
        InviteLinkResponse inviteLink = serverService.getInviteLinkByCode(code);
        return ResponseEntity.ok(inviteLink);
    }

    // ==================== ROLES ====================

    /**
     * Create a new role in the server
     */
    @PostMapping("/{serverId}/roles")
    public ResponseEntity<RoleResponse> createRole(
            @PathVariable Long serverId,
            @Valid @RequestBody CreateRoleRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        RoleResponse role = serverService.createRole(serverId, request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(role);
    }

    /**
     * Get all roles in a server
     */
    @GetMapping("/{serverId}/roles")
    public ResponseEntity<List<RoleResponse>> getServerRoles(
            @PathVariable Long serverId,
            Authentication authentication) {
        String username = authentication.getName();
        List<RoleResponse> roles = serverService.getServerRoles(serverId, username);
        return ResponseEntity.ok(roles);
    }

    /**
     * Delete a role
     */
    @DeleteMapping("/{serverId}/roles/{roleId}")
    public ResponseEntity<Void> deleteRole(
            @PathVariable Long serverId,
            @PathVariable Long roleId,
            Authentication authentication) {
        String username = authentication.getName();
        serverService.deleteRole(serverId, roleId, username);
        return ResponseEntity.noContent().build();
    }

    // ==================== UTILITY ====================

    /**
     * Check if current user is server owner
     */
    @GetMapping("/{serverId}/is-owner")
    public ResponseEntity<Map<String, Boolean>> checkServerOwner(
            @PathVariable Long serverId,
            Authentication authentication) {
        String username = authentication.getName();
        boolean isOwner = serverService.isServerOwner(serverId, username);
        return ResponseEntity.ok(Map.of("isOwner", isOwner));
    }
}
