package vn.cococord.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.cococord.entity.mysql.InviteLink;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface IInviteLinkRepository extends JpaRepository<InviteLink, Long> {

    Optional<InviteLink> findByCode(String code);

    @Query("SELECT il FROM InviteLink il WHERE il.server.id = :serverId AND il.isActive = true")
    List<InviteLink> findActiveByServerId(@Param("serverId") Long serverId);

    @Query("SELECT il FROM InviteLink il WHERE il.isActive = true " +
            "AND (il.expiresAt IS NULL OR il.expiresAt > :now) " +
            "AND (il.maxUses = 0 OR il.currentUses < il.maxUses)")
    List<InviteLink> findValidInvites(@Param("now") LocalDateTime now);
}
