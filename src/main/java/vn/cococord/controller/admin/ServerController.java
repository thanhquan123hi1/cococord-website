package vn.cococord.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.cococord.dto.request.*;
import vn.cococord.dto.response.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Server Management
 * Handles CRUD operations for servers, members, roles, channels, and invite
 * links
 */
@RestController
@RequestMapping("/api/servers")
@RequiredArgsConstructor
public class ServerController {

    private final vn.cococord.service.IServerService serverService;

    /**
     * GET /api/servers
     * Get all servers for current user
     */
    @GetMapping
    public ResponseEntity<List<ServerResponse>> getMyServers(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ServerResponse> servers = serverService.getServersByUsername(userDetails.getUsername());
        return ResponseEntity.ok(servers);
    }

    /**
     * GET /api/servers/{serverId}
     * Get server by ID with full details
     */
    @GetMapping("/{serverId}")
    public ResponseEntity<ServerResponse> getServer(
            @PathVariable Long serverId,
            @AuthenticationPrincipal UserDetails userDetails) {
        ServerResponse server = serverService.getServerById(serverId, userDetails.getUsername());
        return ResponseEntity.ok(server);
    }

    /**
     * POST /api/servers
     * Create new server
     */
    @PostMapping
    public ResponseEntity<ServerResponse> createServer(
            @Valid @RequestBody CreateServerRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ServerResponse server = serverService.createServer(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(server);
    }

    /**
     * PUT /api/servers/{serverId}
     * Update server (Owner only)
     */
    @PutMapping("/{serverId}")
    public ResponseEntity<ServerResponse> updateServer(
            @PathVariable Long serverId,
            @Valid @RequestBody UpdateServerRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ServerResponse server = serverService.updateServer(serverId, request, userDetails.getUsername());
        return ResponseEntity.ok(server);
    }

    /**
     * DELETE /api/servers/{serverId}
     * Delete server (Owner only)
     */
    @DeleteMapping("/{serverId}")
    public ResponseEntity<MessageResponse> deleteServer(
            @PathVariable Long serverId,
            @AuthenticationPrincipal UserDetails userDetails) {
        serverService.deleteServer(serverId, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Server deleted successfully"));
    }

    /**
     * POST /api/servers/{serverId}/leave
     * Leave server
     */
    @PostMapping("/{serverId}/leave")
    public ResponseEntity<MessageResponse> leaveServer(
            @PathVariable Long serverId,
            @AuthenticationPrincipal UserDetails userDetails) {
        serverService.leaveServer(serverId, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Left server successfully"));
    }

    // ===== MEMBER MANAGEMENT =====

    /**
     * GET /api/servers/{serverId}/members
     * Get all members in server
     */
    @GetMapping("/{serverId}/members")
    public ResponseEntity<List<ServerMemberResponse>> getServerMembers(
            @PathVariable Long serverId,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ServerMemberResponse> members = serverService.getServerMembers(serverId, userDetails.getUsername());
        return ResponseEntity.ok(members);
    }

    /**
     * POST /api/servers/{serverId}/members
     * Invite member to server (Admin/Moderator)
     */
    @PostMapping("/{serverId}/members")
    public ResponseEntity<ServerMemberResponse> inviteMember(
            @PathVariable Long serverId,
            @Valid @RequestBody InviteMemberRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement serverService.inviteMember(serverId, request,
        // userDetails.getUsername())
        return ResponseEntity.status(HttpStatus.CREATED).body(ServerMemberResponse.builder().build());
    }

    /**
     * DELETE /api/servers/{serverId}/members/{userId}
     * Kick member from server (Admin/Moderator)
     */
    @DeleteMapping("/{serverId}/members/{userId}")
    public ResponseEntity<MessageResponse> kickMember(
            @PathVariable Long serverId,
            @PathVariable Long userId,
            @Valid @RequestBody(required = false) KickMemberRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        KickMemberRequest kickRequest = request != null ? request : new KickMemberRequest();
        serverService.kickMember(serverId, kickRequest, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Member kicked successfully"));
    }

    /**
     * POST /api/servers/{serverId}/bans
     * Ban member from server (Admin/Moderator)
     */
    @PostMapping("/{serverId}/bans")
    public ResponseEntity<MessageResponse> banMember(
            @PathVariable Long serverId,
            @RequestParam Long userId,
            @Valid @RequestBody BanMemberRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        serverService.banMember(serverId, request, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Member banned successfully"));
    }

    /**
     * DELETE /api/servers/{serverId}/bans/{userId}
     * Unban member (Admin/Moderator)
     */
    @DeleteMapping("/{serverId}/bans/{userId}")
    public ResponseEntity<MessageResponse> unbanMember(
            @PathVariable Long serverId,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        serverService.unbanMember(serverId, userId, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Member unbanned successfully"));
    }

    /**
     * GET /api/servers/{serverId}/bans
     * Get all banned members
     */
    @GetMapping("/{serverId}/bans")
    public ResponseEntity<List<Map<String, Object>>> getBannedMembers(
            @PathVariable Long serverId,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement serverService.getBannedMembers(serverId,
        // userDetails.getUsername())
        return ResponseEntity.ok(List.of());
    }

    // ===== ROLE MANAGEMENT =====

    /**
     * GET /api/servers/{serverId}/roles
     * Get all roles in server
     */
    @GetMapping("/{serverId}/roles")
    public ResponseEntity<List<RoleResponse>> getRoles(
            @PathVariable Long serverId,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<RoleResponse> roles = serverService.getServerRoles(serverId, userDetails.getUsername());
        return ResponseEntity.ok(roles);
    }

    /**
     * POST /api/servers/{serverId}/roles
     * Create new role (Admin only)
     */
    @PostMapping("/{serverId}/roles")
    public ResponseEntity<RoleResponse> createRole(
            @PathVariable Long serverId,
            @Valid @RequestBody CreateRoleRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        RoleResponse role = serverService.createRole(serverId, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(role);
    }

    /**
     * PUT /api/servers/{serverId}/roles/{roleId}
     * Update role (Admin only)
     */
    @PutMapping("/{serverId}/roles/{roleId}")
    public ResponseEntity<RoleResponse> updateRole(
            @PathVariable Long serverId,
            @PathVariable Long roleId,
            @Valid @RequestBody CreateRoleRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement serverService.updateRole(serverId, roleId, request,
        // userDetails.getUsername())
        return ResponseEntity.ok(RoleResponse.builder().build());
    }

    /**
     * DELETE /api/servers/{serverId}/roles/{roleId}
     * Delete role (Admin only)
     */
    @DeleteMapping("/{serverId}/roles/{roleId}")
    public ResponseEntity<MessageResponse> deleteRole(
            @PathVariable Long serverId,
            @PathVariable Long roleId,
            @AuthenticationPrincipal UserDetails userDetails) {
        serverService.deleteRole(serverId, roleId, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Role deleted successfully"));
    }

    /**
     * PUT /api/servers/{serverId}/members/{userId}/role
     * Assign role to member (Admin only)
     */
    @PutMapping("/{serverId}/members/{userId}/role")
    public ResponseEntity<MessageResponse> assignRole(
            @PathVariable Long serverId,
            @PathVariable Long userId,
            @RequestParam Long roleId,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement serverService.assignRole(serverId, userId, roleId,
        // userDetails.getUsername())
        return ResponseEntity.ok(new MessageResponse("Role assigned successfully"));
    }

    // ===== INVITE LINK MANAGEMENT =====

    /**
     * GET /api/servers/{serverId}/invites
     * Get all invite links for server
     */
    @GetMapping("/{serverId}/invites")
    public ResponseEntity<List<InviteLinkResponse>> getInviteLinks(
            @PathVariable Long serverId,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<InviteLinkResponse> invites = serverService.getServerInviteLinks(serverId, userDetails.getUsername());
        return ResponseEntity.ok(invites);
    }

    /**
     * POST /api/servers/{serverId}/invites
     * Create invite link
     */
    @PostMapping("/{serverId}/invites")
    public ResponseEntity<InviteLinkResponse> createInviteLink(
            @PathVariable Long serverId,
            @Valid @RequestBody CreateInviteLinkRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        InviteLinkResponse invite = serverService.createInviteLink(serverId, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(invite);
    }

    /**
     * DELETE /api/servers/{serverId}/invites/{inviteCode}
     * Delete/revoke invite link
     */
    @DeleteMapping("/{serverId}/invites/{inviteCode}")
    public ResponseEntity<MessageResponse> deleteInviteLink(
            @PathVariable Long serverId,
            @PathVariable String inviteCode,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement serverService.deleteInviteLink(serverId, inviteCode,
        // userDetails.getUsername())
        return ResponseEntity.ok(new MessageResponse("Invite link deleted successfully"));
    }

    /**
     * POST /api/invites/{inviteCode}/join
     * Join server using invite code
     */
    @PostMapping("/invites/{inviteCode}/join")
    public ResponseEntity<ServerResponse> joinServerByInvite(
            @PathVariable String inviteCode,
            @AuthenticationPrincipal UserDetails userDetails) {
        ServerResponse server = serverService.joinServerByInvite(inviteCode, userDetails.getUsername());
        return ResponseEntity.ok(server);
    }

    // ===== CATEGORY MANAGEMENT =====

    /**
     * GET /api/servers/{serverId}/categories
     * Get all categories in server
     */
    @GetMapping("/{serverId}/categories")
    public ResponseEntity<List<CategoryResponse>> getCategories(
            @PathVariable Long serverId,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement serverService.getCategories(serverId,
        // userDetails.getUsername())
        return ResponseEntity.ok(List.of());
    }

    /**
     * POST /api/servers/{serverId}/categories
     * Create category (Admin/Moderator)
     */
    @PostMapping("/{serverId}/categories")
    public ResponseEntity<CategoryResponse> createCategory(
            @PathVariable Long serverId,
            @Valid @RequestBody CreateCategoryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement serverService.createCategory(serverId, request,
        // userDetails.getUsername())
        return ResponseEntity.status(HttpStatus.CREATED).body(CategoryResponse.builder().build());
    }

    /**
     * PUT /api/servers/{serverId}/categories/{categoryId}
     * Update category (Admin/Moderator)
     */
    @PutMapping("/{serverId}/categories/{categoryId}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long serverId,
            @PathVariable Long categoryId,
            @Valid @RequestBody CreateCategoryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement serverService.updateCategory(serverId, categoryId, request,
        // userDetails.getUsername())
        return ResponseEntity.ok(CategoryResponse.builder().build());
    }

    /**
     * DELETE /api/servers/{serverId}/categories/{categoryId}
     * Delete category (Admin/Moderator)
     */
    @DeleteMapping("/{serverId}/categories/{categoryId}")
    public ResponseEntity<MessageResponse> deleteCategory(
            @PathVariable Long serverId,
            @PathVariable Long categoryId,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement serverService.deleteCategory(serverId, categoryId,
        // userDetails.getUsername())
        return ResponseEntity.ok(new MessageResponse("Category deleted successfully"));
    }
}
