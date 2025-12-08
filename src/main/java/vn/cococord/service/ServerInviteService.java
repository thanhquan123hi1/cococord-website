package vn.cococord.service;

import vn.cococord.dto.ServerInviteDto;
import vn.cococord.dto.CreateInviteRequest;
import vn.cococord.entity.Server;
import vn.cococord.entity.ServerInvite;
import vn.cococord.entity.ServerMember;
import vn.cococord.entity.User;
import vn.cococord.repository.ServerInviteRepository;
import vn.cococord.repository.ServerMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ServerInviteService {

    private final ServerInviteRepository inviteRepository;
    private final ServerMemberRepository memberRepository;

    public ServerInviteService(ServerInviteRepository inviteRepository, ServerMemberRepository memberRepository) {
        this.inviteRepository = inviteRepository;
        this.memberRepository = memberRepository;
    }

    public ServerInvite createInvite(Server server, User createdBy, CreateInviteRequest request) {
        ServerInvite invite = new ServerInvite();
        invite.setServer(server);
        invite.setCreatedBy(createdBy);
        invite.setCode(generateInviteCode());

        if (request != null) {
            if (request.getExpiresInHours() != null) {
                invite.setExpiryDate(Instant.now().plus(request.getExpiresInHours(), ChronoUnit.HOURS));
            }
            invite.setMaxUses(request.getMaxUses());
        }

        return inviteRepository.save(invite);
    }

    public ServerInvite useInvite(String code, User user) {
        ServerInvite invite = inviteRepository.findByCodeAndActiveTrue(code)
                .orElseThrow(() -> new RuntimeException("Invalid invite code"));

        if (!invite.isValid()) {
            throw new RuntimeException("This invite has expired or reached max uses");
        }

        // Check if user is already a member
        if (memberRepository.existsByServerAndUser(invite.getServer(), user)) {
            throw new RuntimeException("You are already a member of this server");
        }

        // Add user to server
        ServerMember member = new ServerMember();
        member.setServer(invite.getServer());
        member.setUser(user);
        memberRepository.save(member);

        // Increment uses
        invite.setUses(invite.getUses() + 1);
        inviteRepository.save(invite);

        return invite;
    }

    public List<ServerInviteDto> getServerInvites(Server server) {
        return inviteRepository.findByServer(server).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public void deleteInvite(Long inviteId, Server server) {
        ServerInvite invite = inviteRepository.findById(inviteId)
                .orElseThrow(() -> new RuntimeException("Invite not found"));

        if (!invite.getServer().getId().equals(server.getId())) {
            throw new RuntimeException("Invite does not belong to this server");
        }

        invite.setActive(false);
        inviteRepository.save(invite);
    }

    private String generateInviteCode() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    public ServerInviteDto toDto(ServerInvite invite) {
        ServerInviteDto dto = new ServerInviteDto();
        dto.setId(invite.getId());
        dto.setCode(invite.getCode());
        dto.setInviteUrl("/invite/" + invite.getCode());
        dto.setServerId(invite.getServer().getId());
        dto.setServerName(invite.getServer().getName());
        dto.setCreatedByUsername(invite.getCreatedBy() != null ? invite.getCreatedBy().getUsername() : null);
        dto.setExpiryDate(invite.getExpiryDate());
        dto.setMaxUses(invite.getMaxUses());
        dto.setUses(invite.getUses());
        dto.setActive(invite.isActive());
        dto.setCreatedAt(invite.getCreatedAt());
        return dto;
    }
}
