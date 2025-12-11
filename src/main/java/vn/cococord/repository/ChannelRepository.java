package vn.cococord.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.cococord.entity.mysql.Channel;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChannelRepository extends JpaRepository<Channel, Long> {

    @Query("SELECT c FROM Channel c WHERE c.server.id = :serverId ORDER BY c.position ASC")
    List<Channel> findByServerIdOrderByPosition(@Param("serverId") Long serverId);

    @Query("SELECT c FROM Channel c WHERE c.id = :channelId AND c.server.id = :serverId")
    Optional<Channel> findByIdAndServerId(@Param("channelId") Long channelId, @Param("serverId") Long serverId);

    @Query("SELECT c FROM Channel c WHERE c.category.id = :categoryId ORDER BY c.position ASC")
    List<Channel> findByCategoryIdOrderByPosition(@Param("categoryId") Long categoryId);

    @Query("SELECT COALESCE(MAX(c.position), -1) FROM Channel c WHERE c.server.id = :serverId")
    Integer findMaxPositionByServerId(@Param("serverId") Long serverId);
}
