package vn.cococord.repository.mysql;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import vn.cococord.entity.mysql.ServerBan;

@Repository
public interface IServerBanRepository extends JpaRepository<ServerBan, Long> {

    List<ServerBan> findByServerId(Long serverId);

    Optional<ServerBan> findByServerIdAndUserId(Long serverId, Long userId);

    boolean existsByServerIdAndUserId(Long serverId, Long userId);

    void deleteByServerIdAndUserId(Long serverId, Long userId);
}
