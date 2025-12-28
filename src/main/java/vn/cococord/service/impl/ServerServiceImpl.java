package vn.cococord.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.request.BanMemberRequest;
import vn.cococord.dto.request.CreateInviteLinkRequest;
import vn.cococord.dto.request.CreateRoleRequest;
import vn.cococord.dto.request.CreateServerRequest;
import vn.cococord.dto.request.KickMemberRequest;
import vn.cococord.dto.request.UpdateServerRequest;
import vn.cococord.dto.response.ChannelResponse;
import vn.cococord.dto.response.InviteLinkResponse;
import vn.cococord.dto.response.RoleResponse;
import vn.cococord.dto.response.ServerMemberResponse;
import vn.cococord.dto.response.ServerResponse;
import vn.cococord.entity.mysql.Channel;
import vn.cococord.entity.mysql.InviteLink;
import vn.cococord.entity.mysql.Role;
import vn.cococord.entity.mysql.Server;
import vn.cococord.entity.mysql.ServerMember;
import vn.cococord.entity.mysql.User;
import vn.cococord.exception.BadRequestException;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.exception.UnauthorizedException;
import vn.cococord.repository.IChannelRepository;
import vn.cococord.repository.IInviteLinkRepository;
import vn.cococord.repository.IRoleRepository;
import vn.cococord.repository.IServerMemberRepository;
import vn.cococord.repository.IServerRepository;
import vn.cococord.repository.IUserRepository;
import vn.cococord.service.IPermissionService;
import vn.cococord.service.IServerService;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
@SuppressWarnings("null")
public class ServerServiceImpl implements IServerService {

    private final IServerRepository serverRepository;
    private final IServerMemberRepository serverMemberRepository;
    private final IUserRepository userRepository;
    private final IRoleRepository roleRepository;
    private final IInviteLinkRepository inviteLinkRepository;
    private final IChannelRepository channelRepository;
    private final IPermissionService permissionService;

    @Override
    public ServerResponse createServer(CreateServerRequest request, String username) {
        User owner = getUserByUsername(username);

        // Create server
        Server server = Server.builder()
                .name(request.getName())
                .description(request.getDescription())
                .iconUrl(request.getIconUrl())
                .bannerUrl(request.getBannerUrl())
                .owner(owner)
                .isPublic(request.getIsPublic())
                .maxMembers(request.getMaxMembers())
                .build();

        server = serverRepository.save(server);

        // Create default role (@everyone)
        Role defaultRole = Role.builder()
                .server(server)
                .name("@everyone")
                .color("#99AAB5")
                .position(0)
                .isDefault(true)
                .isMentionable(true)
                .build();
        roleRepository.save(defaultRole);

        // Add owner as member with default role
        ServerMember ownerMember = ServerMember.builder()
                .server(server)
                .user(owner)
                .role(defaultRole)
                .build();
        serverMemberRepository.save(ownerMember);

        // Create default channels
        Channel generalChannel = Channel.builder()
                .server(server)
                .name("general")
                .type(Channel.ChannelType.TEXT)
                .topic("General discussion")
                .position(0)
                .isPrivate(false)
                .isDefault(true)
                .build();
        channelRepository.save(generalChannel);

        log.info("Server created: {} by user: {}", server.getName(), username);
        return convertToServerResponse(server);
    }

    @Override
    @Transactional(readOnly = true)
    public ServerResponse getServerById(Long serverId, String username) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found with id: " + serverId));

        // Check if user is member
        if (!isServerMember(serverId, username)) {
            throw new UnauthorizedException("You are not a member of this server");
        }

        return convertToServerResponse(server);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServerResponse> getServersByUsername(String username) {
        User user = getUserByUsername(username);
        List<Server> servers = serverRepository.findAllByUserId(user.getId());

        return servers.stream()
                .map(this::convertToServerResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ServerResponse updateServer(Long serverId, UpdateServerRequest request, String username) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found with id: " + serverId));

        // Only owner can update server
        if (!isServerOwner(serverId, username)) {
            throw new UnauthorizedException("Only server owner can update server settings");
        }

        // Update fields
        if (request.getName() != null) {
            server.setName(request.getName());
        }
        if (request.getDescription() != null) {
            server.setDescription(request.getDescription());
        }
        if (request.getIconUrl() != null) {
            server.setIconUrl(request.getIconUrl());
        }
        if (request.getBannerUrl() != null) {
            server.setBannerUrl(request.getBannerUrl());
        }
        if (request.getIsPublic() != null) {
            server.setIsPublic(request.getIsPublic());
        }

        server = serverRepository.save(server);
        log.info("Server updated: {} by user: {}", server.getName(), username);

        return convertToServerResponse(server);
    }

    @Override
    public void deleteServer(Long serverId, String username) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found with id: " + serverId));

        // Only owner can delete server
        if (!isServerOwner(serverId, username)) {
            throw new UnauthorizedException("Only server owner can delete the server");
        }

        serverRepository.delete(server);
        log.info("Server deleted: {} by user: {}", server.getName(), username);
    }

    @Override
    public void leaveServer(Long serverId, String username) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found with id: " + serverId));

        User user = getUserByUsername(username);

        // Owner cannot leave their own server
        if (server.getOwner().getId().equals(user.getId())) {
            throw new BadRequestException(
                    "Server owner cannot leave the server. Transfer ownership or delete the server.");
        }

        ServerMember member = serverMemberRepository.findByServerIdAndUserId(serverId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("You are not a member of this server"));

        serverMemberRepository.delete(member);
        log.info("User {} left server: {}", username, server.getName());
    }

    @Override
    public ServerMemberResponse addMember(Long serverId, Long userId, String username) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found with id: " + serverId));

        User newUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Check if already member
        if (serverMemberRepository.existsByServerIdAndUserId(serverId, userId)) {
            throw new BadRequestException("User is already a member of this server");
        }

        // Check max members
        Long currentMemberCount = serverMemberRepository.countByServerId(serverId);
        if (currentMemberCount >= server.getMaxMembers()) {
            throw new BadRequestException("Server has reached maximum member limit");
        }

        // Get default role
        Role defaultRole = roleRepository.findDefaultRoleByServerId(serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Default role not found"));

        ServerMember member = ServerMember.builder()
                .server(server)
                .user(newUser)
                .role(defaultRole)
                .build();

        member = serverMemberRepository.save(member);
        log.info("User {} added to server: {}", newUser.getUsername(), server.getName());

        return convertToMemberResponse(member);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServerMemberResponse> getServerMembers(Long serverId, String username) {
        if (!isServerMember(serverId, username)) {
            throw new UnauthorizedException("You are not a member of this server");
        }

        List<ServerMember> members = serverMemberRepository.findByServerId(serverId);
        return members.stream()
                .map(this::convertToMemberResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void kickMember(Long serverId, KickMemberRequest request, String username) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found with id: " + serverId));

        User kicker = getUserByUsername(username);
        
        // Check if user has KICK_MEMBERS permission (or is owner/admin)
        if (!permissionService.canKickMembers(kicker.getId(), serverId)) {
            throw new UnauthorizedException("You don't have permission to kick members");
        }

        User targetUser = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Cannot kick owner
        if (server.getOwner().getId().equals(targetUser.getId())) {
            throw new BadRequestException("Cannot kick server owner");
        }
        
        // Cannot kick administrators unless you're the owner
        if (permissionService.isAdministrator(targetUser.getId(), serverId) && 
            !permissionService.isServerOwner(kicker.getId(), serverId)) {
            throw new BadRequestException("Only the server owner can kick administrators");
        }

        ServerMember member = serverMemberRepository.findByServerIdAndUserId(serverId, request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User is not a member of this server"));

        serverMemberRepository.delete(member);
        log.info("User {} kicked from server: {} by {}", targetUser.getUsername(), server.getName(), username);
    }

    @Override
    public void banMember(Long serverId, BanMemberRequest request, String username) {
        // TODO: Implement ban functionality with ServerBan entity
        throw new UnsupportedOperationException("Ban member feature not yet implemented");
    }

    @Override
    public void unbanMember(Long serverId, Long userId, String username) {
        // TODO: Implement unban functionality
        throw new UnsupportedOperationException("Unban member feature not yet implemented");
    }

    @Override
    public InviteLinkResponse createInviteLink(Long serverId, CreateInviteLinkRequest request, String username) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found with id: " + serverId));

        if (!isServerMember(serverId, username)) {
            throw new UnauthorizedException("You are not a member of this server");
        }

        User creator = getUserByUsername(username);

        LocalDateTime expiresAt = null;
        if (request.getExpiresInDays() != null && request.getExpiresInDays() > 0) {
            expiresAt = LocalDateTime.now().plusDays(request.getExpiresInDays());
        }

        InviteLink inviteLink = InviteLink.builder()
                .server(server)
                .createdBy(creator)
                .maxUses(request.getMaxUses() != null ? request.getMaxUses() : 0)
                .expiresAt(expiresAt)
                .build();

        inviteLink = inviteLinkRepository.save(inviteLink);
        log.info("Invite link created for server: {} by user: {}", server.getName(), username);

        return convertToInviteLinkResponse(inviteLink);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InviteLinkResponse> getServerInviteLinks(Long serverId, String username) {
        if (!isServerMember(serverId, username)) {
            throw new UnauthorizedException("You are not a member of this server");
        }

        List<InviteLink> inviteLinks = inviteLinkRepository.findActiveByServerId(serverId);
        return inviteLinks.stream()
                .map(this::convertToInviteLinkResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public InviteLinkResponse getInviteLinkByCode(String code) {
        InviteLink inviteLink = inviteLinkRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Invite link not found or expired"));

        // Check if valid
        if (!inviteLink.getIsActive()) {
            throw new BadRequestException("Invite link is no longer active");
        }

        if (inviteLink.getExpiresAt() != null && inviteLink.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Invite link has expired");
        }

        if (inviteLink.getMaxUses() > 0 && inviteLink.getCurrentUses() >= inviteLink.getMaxUses()) {
            throw new BadRequestException("Invite link has reached maximum uses");
        }

        return convertToInviteLinkResponse(inviteLink);
    }

    @Override
    public ServerResponse joinServerByInvite(String code, String username) {
        InviteLink inviteLink = inviteLinkRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Invite link not found or expired"));

        // Validate invite link
        if (!inviteLink.getIsActive()) {
            throw new BadRequestException("Invite link is no longer active");
        }

        if (inviteLink.getExpiresAt() != null && inviteLink.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Invite link has expired");
        }

        if (inviteLink.getMaxUses() > 0 && inviteLink.getCurrentUses() >= inviteLink.getMaxUses()) {
            throw new BadRequestException("Invite link has reached maximum uses");
        }

        User user = getUserByUsername(username);
        Server server = inviteLink.getServer();

        // Check if already member
        if (serverMemberRepository.existsByServerIdAndUserId(server.getId(), user.getId())) {
            throw new BadRequestException("You are already a member of this server");
        }

        // Add as member
        addMember(server.getId(), user.getId(), username);

        // Increment usage count
        inviteLink.setCurrentUses(inviteLink.getCurrentUses() + 1);
        inviteLinkRepository.save(inviteLink);

        log.info("User {} joined server: {} via invite code: {}", username, server.getName(), code);

        return convertToServerResponse(server);
    }

    @Override
    public void deleteInviteLink(Long serverId, Long inviteLinkId, String username) {
        if (!isServerMember(serverId, username)) {
            throw new UnauthorizedException("You are not a member of this server");
        }

        InviteLink inviteLink = inviteLinkRepository.findById(inviteLinkId)
                .orElseThrow(() -> new ResourceNotFoundException("Invite link not found"));

        if (!inviteLink.getServer().getId().equals(serverId)) {
            throw new BadRequestException("Invite link does not belong to this server");
        }

        inviteLinkRepository.delete(inviteLink);
        log.info("Invite link deleted from server: {} by user: {}", inviteLink.getServer().getName(), username);
    }

    @Override
    public RoleResponse createRole(Long serverId, CreateRoleRequest request, String username) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found with id: " + serverId));

        if (!isServerOwner(serverId, username)) {
            throw new UnauthorizedException("Only server owner can create roles");
        }

        Role role = Role.builder()
                .server(server)
                .name(request.getName())
                .color(request.getColor() != null ? request.getColor() : "#99AAB5")
                .position(request.getPosition() != null ? request.getPosition() : 0)
                .isHoisted(request.getIsHoisted() != null ? request.getIsHoisted() : false)
                .isMentionable(request.getIsMentionable() != null ? request.getIsMentionable() : true)
                .isDefault(false)
                .build();

        role = roleRepository.save(role);
        log.info("Role created: {} in server: {} by user: {}", role.getName(), server.getName(), username);

        return convertToRoleResponse(role);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponse> getServerRoles(Long serverId, String username) {
        if (!isServerMember(serverId, username)) {
            throw new UnauthorizedException("You are not a member of this server");
        }

        List<Role> roles = roleRepository.findByServerIdOrderByPositionDesc(serverId);
        return roles.stream()
                .map(this::convertToRoleResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteRole(Long serverId, Long roleId, String username) {
        if (!isServerOwner(serverId, username)) {
            throw new UnauthorizedException("Only server owner can delete roles");
        }

        Role role = roleRepository.findByIdAndServerId(roleId, serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        if (role.getIsDefault()) {
            throw new BadRequestException("Cannot delete default role");
        }

        roleRepository.delete(role);
        log.info("Role deleted: {} from server: {} by user: {}", role.getName(), role.getServer().getName(), username);
    }

    @Override
    public boolean isServerOwner(Long serverId, String username) {
        User user = getUserByUsername(username);
        return serverRepository.existsByIdAndOwnerId(serverId, user.getId());
    }

    @Override
    public boolean isServerMember(Long serverId, String username) {
        User user = getUserByUsername(username);
        return serverMemberRepository.existsByServerIdAndUserId(serverId, user.getId());
    }

    // Helper methods
    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private ServerResponse convertToServerResponse(Server server) {
        Long memberCount = serverMemberRepository.countByServerId(server.getId());
        List<Channel> channels = channelRepository.findByServerIdOrderByPosition(server.getId());
        List<Role> roles = roleRepository.findByServerIdOrderByPositionDesc(server.getId());

        return ServerResponse.builder()
                .id(server.getId())
                .name(server.getName())
                .description(server.getDescription())
                .iconUrl(server.getIconUrl())
                .bannerUrl(server.getBannerUrl())
                .ownerId(server.getOwner().getId())
                .ownerUsername(server.getOwner().getUsername())
                .isPublic(server.getIsPublic())
                .maxMembers(server.getMaxMembers())
                .memberCount(memberCount.intValue())
                .createdAt(server.getCreatedAt())
                .updatedAt(server.getUpdatedAt())
                .channels(channels.stream().map(this::convertToChannelResponse).collect(Collectors.toList()))
                .roles(roles.stream().map(this::convertToRoleResponse).collect(Collectors.toList()))
                .build();
    }

    private ServerMemberResponse convertToMemberResponse(ServerMember member) {
        return ServerMemberResponse.builder()
                .id(member.getId())
                .userId(member.getUser().getId())
                .username(member.getUser().getUsername())
                .displayName(member.getUser().getDisplayName())
                .avatarUrl(member.getUser().getAvatarUrl())
                .nickname(member.getNickname())
                .roleId(member.getRole() != null ? member.getRole().getId() : null)
                .roleName(member.getRole() != null ? member.getRole().getName() : null)
                .isMuted(member.getIsMuted())
                .isDeafened(member.getIsDeafened())
                .joinedAt(member.getJoinedAt())
                .build();
    }

    private InviteLinkResponse convertToInviteLinkResponse(InviteLink inviteLink) {
        return InviteLinkResponse.builder()
                .id(inviteLink.getId())
                .serverId(inviteLink.getServer().getId())
                .serverName(inviteLink.getServer().getName())
                .code(inviteLink.getCode())
                .maxUses(inviteLink.getMaxUses())
                .currentUses(inviteLink.getCurrentUses())
                .expiresAt(inviteLink.getExpiresAt())
                .isActive(inviteLink.getIsActive())
                .createdBy(inviteLink.getCreatedBy().getUsername())
                .createdAt(inviteLink.getCreatedAt())
                .build();
    }

    private RoleResponse convertToRoleResponse(Role role) {
        return RoleResponse.builder()
                .id(role.getId())
                .serverId(role.getServer().getId())
                .name(role.getName())
                .color(role.getColor())
                .position(role.getPosition())
                .isHoisted(role.getIsHoisted())
                .isMentionable(role.getIsMentionable())
                .isDefault(role.getIsDefault())
                .createdAt(role.getCreatedAt())
                .updatedAt(role.getUpdatedAt())
                .build();
    }

    private ChannelResponse convertToChannelResponse(Channel channel) {
        return ChannelResponse.builder()
                .id(channel.getId())
                .serverId(channel.getServer().getId())
                .categoryId(channel.getCategory() != null ? channel.getCategory().getId() : null)
                .name(channel.getName())
                .type(channel.getType().name())
                .topic(channel.getTopic())
                .position(channel.getPosition())
                .isPrivate(channel.getIsPrivate())
                .isNsfw(channel.getIsNsfw())
                .slowMode(channel.getSlowMode())
                .createdAt(channel.getCreatedAt())
                .updatedAt(channel.getUpdatedAt())
                .build();
    }
}
