package vn.cococord.service;

import vn.cococord.dto.request.*;
import vn.cococord.dto.response.*;

import java.util.List;

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

    // Helper methods
    boolean isServerOwner(Long serverId, String username);

    boolean isServerMember(Long serverId, String username);

    boolean canAccessServerSettings(Long serverId, String username);
}
