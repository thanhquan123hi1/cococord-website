package vn.cococord.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.cococord.entity.mysql.ServerMember;

import java.util.List;
import java.util.Optional;

@Repository
public interface IServerMemberRepository extends JpaRepository<ServerMember, Long> {

    @Query("SELECT sm FROM ServerMember sm WHERE sm.server.id = :serverId AND sm.user.id = :userId")
    Optional<ServerMember> findByServerIdAndUserId(@Param("serverId") Long serverId, @Param("userId") Long userId);

    @Query("SELECT sm FROM ServerMember sm WHERE sm.server.id = :serverId")
    List<ServerMember> findByServerId(@Param("serverId") Long serverId);

    boolean existsByServerIdAndUserId(Long serverId, Long userId);

    void deleteByServerIdAndUserId(Long serverId, Long userId);

    @Query("SELECT COUNT(sm) FROM ServerMember sm WHERE sm.server.id = :serverId")
    Long countByServerId(@Param("serverId") Long serverId);
}
