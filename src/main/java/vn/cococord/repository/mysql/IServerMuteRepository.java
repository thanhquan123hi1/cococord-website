package vn.cococord.repository.mysql;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import vn.cococord.entity.mysql.ServerMute;

@Repository
public interface IServerMuteRepository extends JpaRepository<ServerMute, Long> {

    List<ServerMute> findByServerId(Long serverId);

    Optional<ServerMute> findByServerIdAndUserId(Long serverId, Long userId);

    boolean existsByServerIdAndUserId(Long serverId, Long userId);

    void deleteByServerIdAndUserId(Long serverId, Long userId);

    /**
     * Find active mutes (not expired)
     */
    @Query("SELECT m FROM ServerMute m WHERE m.server.id = :serverId AND (m.expiresAt IS NULL OR m.expiresAt > :now)")
    List<ServerMute> findActiveByServerId(Long serverId, LocalDateTime now);

    /**
     * Check if user is currently muted
     */
    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM ServerMute m WHERE m.server.id = :serverId AND m.user.id = :userId AND (m.expiresAt IS NULL OR m.expiresAt > :now)")
    boolean isUserMuted(Long serverId, Long userId, LocalDateTime now);
}
