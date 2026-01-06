package vn.cococord.controller.user;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.request.BanMemberRequest;
import vn.cococord.dto.request.CreateInviteLinkRequest;
import vn.cococord.dto.request.CreateRoleRequest;
import vn.cococord.dto.request.CreateServerRequest;
import vn.cococord.dto.request.KickMemberRequest;
import vn.cococord.dto.request.MuteMemberRequest;
import vn.cococord.dto.request.UpdateRoleRequest;
import vn.cococord.dto.request.UpdateServerRequest;
import vn.cococord.dto.response.InviteLinkResponse;
import vn.cococord.dto.response.RoleResponse;
import vn.cococord.dto.response.ServerBanResponse;
import vn.cococord.dto.response.ServerMemberResponse;
import vn.cococord.dto.response.ServerMuteResponse;
import vn.cococord.dto.response.ServerResponse;
import vn.cococord.service.IServerService;

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

    /**
     * Get all banned members of a server
     */
    @GetMapping("/{serverId}/bans")
    public ResponseEntity<List<ServerBanResponse>> getBannedMembers(
            @PathVariable Long serverId,
            Authentication authentication) {
        String username = authentication.getName();
        List<ServerBanResponse> bans = serverService.getBannedMembers(serverId, username);
        return ResponseEntity.ok(bans);
    }

    /**
     * Mute a member in the server
     */
    @PostMapping("/{serverId}/mute")
    public ResponseEntity<Void> muteMember(
            @PathVariable Long serverId,
            @Valid @RequestBody MuteMemberRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        serverService.muteMember(serverId, request, username);
        return ResponseEntity.noContent().build();
    }

    /**
     * Unmute a member in the server
     */
    @DeleteMapping("/{serverId}/mute/{userId}")
    public ResponseEntity<Void> unmuteMember(
            @PathVariable Long serverId,
            @PathVariable Long userId,
            Authentication authentication) {
        String username = authentication.getName();
        serverService.unmuteMember(serverId, userId, username);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all muted members of a server
     */
    @GetMapping("/{serverId}/mutes")
    public ResponseEntity<List<ServerMuteResponse>> getMutedMembers(
            @PathVariable Long serverId,
            Authentication authentication) {
        String username = authentication.getName();
        List<ServerMuteResponse> mutes = serverService.getMutedMembers(serverId, username);
        return ResponseEntity.ok(mutes);
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
     * Update a role's settings
     */
    @PutMapping("/{serverId}/roles/{roleId}")
    public ResponseEntity<RoleResponse> updateRole(
            @PathVariable Long serverId,
            @PathVariable Long roleId,
            @Valid @RequestBody UpdateRoleRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        RoleResponse role = serverService.updateRole(serverId, roleId, request, username);
        return ResponseEntity.ok(role);
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

    /**
     * Check if current user can access server settings
     */
    @GetMapping("/{serverId}/can-access-settings")
    public ResponseEntity<Map<String, Boolean>> canAccessServerSettings(
            @PathVariable Long serverId,
            Authentication authentication) {
        String username = authentication.getName();
        boolean canAccess = serverService.canAccessServerSettings(serverId, username);
        return ResponseEntity.ok(Map.of("canAccess", canAccess));
    }

    // ==================== ICON/BANNER UPLOAD ====================

    /**
     * Upload server icon
     */
    @PostMapping("/{serverId}/icon")
    public ResponseEntity<Map<String, String>> uploadServerIcon(
            @PathVariable Long serverId,
            @RequestParam("icon") MultipartFile file,
            Authentication authentication) {
        String username = authentication.getName();
        String iconUrl = serverService.uploadServerIcon(serverId, file, username);
        return ResponseEntity.ok(Map.of("iconUrl", iconUrl));
    }

    /**
     * Upload server banner
     */
    @PostMapping("/{serverId}/banner")
    public ResponseEntity<Map<String, String>> uploadServerBanner(
            @PathVariable Long serverId,
            @RequestParam("banner") MultipartFile file,
            Authentication authentication) {
        String username = authentication.getName();
        String bannerUrl = serverService.uploadServerBanner(serverId, file, username);
        return ResponseEntity.ok(Map.of("bannerUrl", bannerUrl));
    }

    // ==================== MEMBER ROLE MANAGEMENT ====================

    /**
     * Update a member's role
     */
    @PutMapping("/{serverId}/members/{memberId}/role")
    public ResponseEntity<ServerMemberResponse> updateMemberRole(
            @PathVariable Long serverId,
            @PathVariable Long memberId,
            @RequestParam Long roleId,
            Authentication authentication) {
        String username = authentication.getName();
        ServerMemberResponse member = serverService.updateMemberRole(serverId, memberId, roleId, username);
        return ResponseEntity.ok(member);
    }

    // ==================== OWNERSHIP TRANSFER ====================

    /**
     * Transfer server ownership to another member
     */
    @PostMapping("/{serverId}/transfer-ownership")
    public ResponseEntity<Map<String, String>> transferOwnership(
            @PathVariable Long serverId,
            @RequestParam Long newOwnerId,
            Authentication authentication) {
        String username = authentication.getName();
        serverService.transferOwnership(serverId, newOwnerId, username);
        return ResponseEntity.ok(Map.of("message", "Ownership transferred successfully"));
    }
}
