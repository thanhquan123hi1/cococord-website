package vn.cococord.service;

import vn.cococord.dto.ServerDto;
import vn.cococord.dto.ServerMemberDto;
import vn.cococord.entity.*;
import vn.cococord.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ServerService {
    private final ServerRepository serverRepository;
    private final ServerMemberRepository serverMemberRepository;
    private final RoleService roleService;

    public ServerService(ServerRepository serverRepository,
            ServerMemberRepository serverMemberRepository,
            RoleService roleService) {
        this.serverRepository = serverRepository;
        this.serverMemberRepository = serverMemberRepository;
        this.roleService = roleService;
    }

    public Server createServer(User owner, String name, String description) {
        Server server = new Server();
        server.setName(name);
        server.setDescription(description);
        server.setOwner(owner);
        server.setPublic(true);
        server = serverRepository.save(server);

        // Create default @everyone role
        roleService.createDefaultRole(server);

        // Add owner as first member
        ServerMember member = new ServerMember();
        member.setServer(server);
        member.setUser(owner);
        member.setNickname(owner.getUsername());
        serverMemberRepository.save(member);

        return server;
    }

    public Optional<Server> findById(Long id) {
        return serverRepository.findById(id);
    }

    public List<Server> listServersOfUser(User user) {
        List<ServerMember> memberships = serverMemberRepository.findByUser(user);
        return memberships.stream().map(ServerMember::getServer).collect(Collectors.toList());
    }

    public Server updateServer(Long serverId, Map<String, String> updates, User user) {
        Server server = findById(serverId).orElseThrow(() -> new RuntimeException("Server not found"));

        if (!server.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Only the owner can update the server");
        }

        if (updates.containsKey("name")) {
            server.setName(updates.get("name"));
        }
        if (updates.containsKey("description")) {
            server.setDescription(updates.get("description"));
        }
        if (updates.containsKey("iconUrl")) {
            server.setIconUrl(updates.get("iconUrl"));
        }

        return serverRepository.save(server);
    }

    public void deleteServer(Long serverId, User user) {
        Server server = findById(serverId).orElseThrow(() -> new RuntimeException("Server not found"));

        if (!server.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Only the owner can delete the server");
        }

        serverRepository.delete(server);
    }

    public void leaveServer(Long serverId, User user) {
        Server server = findById(serverId).orElseThrow(() -> new RuntimeException("Server not found"));

        if (server.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Owner cannot leave the server. Transfer ownership first or delete the server.");
        }

        ServerMember member = serverMemberRepository.findByServerAndUser(server, user)
                .orElseThrow(() -> new RuntimeException("Not a member of this server"));

        serverMemberRepository.delete(member);
    }

    public List<ServerMemberDto> getMembers(Server server) {
        return serverMemberRepository.findByServer(server).stream()
                .map(this::toMemberDto)
                .collect(Collectors.toList());
    }

    public void verifyPermission(Server server, User user, String permission) {
        // Owner has all permissions
        if (server.getOwner().getId().equals(user.getId())) {
            return;
        }

        ServerMember member = serverMemberRepository.findByServerAndUser(server, user)
                .orElseThrow(() -> new RuntimeException("Not a member of this server"));

        if (!roleService.hasPermission(member, permission)) {
            throw new RuntimeException("You don't have permission to perform this action");
        }
    }

    public long countAllServers() {
        return serverRepository.count();
    }

    public Page<ServerDto> getAllServers(int page, int size, String search) {
        Page<Server> servers;
        if (search != null && !search.isEmpty()) {
            servers = serverRepository.findByNameContainingIgnoreCase(search, PageRequest.of(page, size));
        } else {
            servers = serverRepository.findAll(PageRequest.of(page, size));
        }
        return servers.map(this::toDto);
    }

    public void adminDeleteServer(Long serverId, User admin) {
        Server server = findById(serverId).orElseThrow(() -> new RuntimeException("Server not found"));
        serverRepository.delete(server);
    }

    public ServerDto toDto(Server server) {
        return new ServerDto(server.getId(), server.getName(), server.getIconUrl());
    }

    private ServerMemberDto toMemberDto(ServerMember member) {
        ServerMemberDto dto = new ServerMemberDto();
        dto.setId(member.getId());
        dto.setUserId(member.getUser().getId());
        dto.setUsername(member.getUser().getUsername());
        dto.setDisplayName(member.getNickname() != null ? member.getNickname() : member.getUser().getDisplayName());
        dto.setAvatarUrl(member.getUser().getAvatarUrl());
        dto.setStatus(member.getUser().getStatus().name());
        dto.setOwner(member.getServer().getOwner().getId().equals(member.getUser().getId()));
        return dto;
    }
}
