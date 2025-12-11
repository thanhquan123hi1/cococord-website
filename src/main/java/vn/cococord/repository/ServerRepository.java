package vn.cococord.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.cococord.entity.mysql.Server;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServerRepository extends JpaRepository<Server, Long> {

    @Query("SELECT s FROM Server s WHERE s.owner.id = :userId")
    List<Server> findByOwnerId(@Param("userId") Long userId);

    @Query("SELECT DISTINCT s FROM Server s " +
            "LEFT JOIN s.members m " +
            "WHERE s.owner.id = :userId OR m.user.id = :userId")
    List<Server> findAllByUserId(@Param("userId") Long userId);

    @Query("SELECT s FROM Server s " +
            "LEFT JOIN FETCH s.owner " +
            "LEFT JOIN FETCH s.channels " +
            "LEFT JOIN FETCH s.roles " +
            "WHERE s.id = :serverId")
    Optional<Server> findByIdWithDetails(@Param("serverId") Long serverId);

    boolean existsByIdAndOwnerId(Long serverId, Long ownerId);
}
