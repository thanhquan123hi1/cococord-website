package vn.cococord.service;

import vn.cococord.dto.ServerBanDto;
import vn.cococord.entity.Server;
import vn.cococord.entity.ServerBan;
import vn.cococord.entity.ServerMember;
import vn.cococord.entity.User;
import vn.cococord.repository.ServerBanRepository;
import vn.cococord.repository.ServerMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ServerBanService {

    private final ServerBanRepository banRepository;
    private final ServerMemberRepository memberRepository;

    public ServerBanService(ServerBanRepository banRepository, ServerMemberRepository memberRepository) {
        this.banRepository = banRepository;
        this.memberRepository = memberRepository;
    }

    public ServerBan banUser(Server server, User user, User bannedBy, String reason) {
        // Check if already banned
        if (banRepository.existsByServerAndUser(server, user)) {
            throw new RuntimeException("User is already banned from this server");
        }

        // Cannot ban server owner
        if (server.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Cannot ban the server owner");
        }

        // Remove from server if member
        memberRepository.findByServerAndUser(server, user)
                .ifPresent(memberRepository::delete);

        // Create ban record
        ServerBan ban = new ServerBan();
        ban.setServer(server);
        ban.setUser(user);
        ban.setBannedBy(bannedBy);
        ban.setReason(reason);

        return banRepository.save(ban);
    }

    public void unbanUser(Server server, User user) {
        banRepository.deleteByServerAndUser(server, user);
    }

    public boolean isBanned(Server server, User user) {
        return banRepository.existsByServerAndUser(server, user);
    }

    public List<ServerBanDto> getServerBans(Server server) {
        return banRepository.findByServer(server).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public void kickUser(Server server, User user) {
        // Cannot kick server owner
        if (server.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Cannot kick the server owner");
        }

        ServerMember member = memberRepository.findByServerAndUser(server, user)
                .orElseThrow(() -> new RuntimeException("User is not a member of this server"));

        memberRepository.delete(member);
    }

    private ServerBanDto toDto(ServerBan ban) {
        ServerBanDto dto = new ServerBanDto();
        dto.setId(ban.getId());
        dto.setUserId(ban.getUser().getId());
        dto.setUsername(ban.getUser().getUsername());
        dto.setAvatarUrl(ban.getUser().getAvatarUrl());
        dto.setBannedByUsername(ban.getBannedBy() != null ? ban.getBannedBy().getUsername() : null);
        dto.setReason(ban.getReason());
        dto.setBannedAt(ban.getBannedAt());
        return dto;
    }
}
