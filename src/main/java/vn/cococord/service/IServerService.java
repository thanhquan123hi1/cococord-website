package vn.cococord.service;

import java.util.List;

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

public interface IServerService {

    // Server CRUD
    ServerResponse createServer(CreateServerRequest request, String username);

    ServerResponse getServerById(Long serverId, String username);

    List<ServerResponse> getServersByUsername(String username);

    ServerResponse updateServer(Long serverId, UpdateServerRequest request, String username);

    void deleteServer(Long serverId, String username);

    // Member Management
    void leaveServer(Long serverId, String username);

    ServerMemberResponse addMember(Long serverId, Long userId, String username);

    List<ServerMemberResponse> getServerMembers(Long serverId, String username);

    void kickMember(Long serverId, KickMemberRequest request, String username);

    // Ban Management
    void banMember(Long serverId, BanMemberRequest request, String username);

    void unbanMember(Long serverId, Long userId, String username);

    List<ServerBanResponse> getBannedMembers(Long serverId, String username);

    // Mute/Timeout Management
    void muteMember(Long serverId, MuteMemberRequest request, String username);

    void unmuteMember(Long serverId, Long userId, String username);

    List<ServerMuteResponse> getMutedMembers(Long serverId, String username);

    // Invite Links
    InviteLinkResponse createInviteLink(Long serverId, CreateInviteLinkRequest request, String username);

    List<InviteLinkResponse> getServerInviteLinks(Long serverId, String username);

    InviteLinkResponse getInviteLinkByCode(String code);

    ServerResponse joinServerByInvite(String code, String username);

    void deleteInviteLink(Long serverId, Long inviteLinkId, String username);

    // Role Management
    RoleResponse createRole(Long serverId, CreateRoleRequest request, String username);

    List<RoleResponse> getServerRoles(Long serverId, String username);

    RoleResponse updateRole(Long serverId, Long roleId, UpdateRoleRequest request, String username);

    void deleteRole(Long serverId, Long roleId, String username);

    // Icon/Banner Management
    String uploadServerIcon(Long serverId, org.springframework.web.multipart.MultipartFile file, String username);

    String uploadServerBanner(Long serverId, org.springframework.web.multipart.MultipartFile file, String username);

    // Member Role Management
    ServerMemberResponse updateMemberRole(Long serverId, Long memberId, Long roleId, String username);

    // Ownership Transfer
    void transferOwnership(Long serverId, Long newOwnerId, String username);

    // Helper methods
    boolean isServerOwner(Long serverId, String username);

    boolean isServerMember(Long serverId, String username);

    boolean canAccessServerSettings(Long serverId, String username);
}
