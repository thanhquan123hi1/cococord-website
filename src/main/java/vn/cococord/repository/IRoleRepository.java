package vn.cococord.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.cococord.entity.mysql.Role;

@Repository
public interface IRoleRepository extends JpaRepository<Role, Long> {

    @Query("SELECT r FROM Role r WHERE r.server.id = :serverId ORDER BY r.position DESC")
    List<Role> findByServerIdOrderByPositionDesc(@Param("serverId") Long serverId);

    @Query("SELECT r FROM Role r WHERE r.server.id = :serverId AND r.isDefault = true")
    Optional<Role> findDefaultRoleByServerId(@Param("serverId") Long serverId);

    @Query("SELECT r FROM Role r WHERE r.id = :roleId AND r.server.id = :serverId")
    Optional<Role> findByIdAndServerId(@Param("roleId") Long roleId, @Param("serverId") Long serverId);

    @Query("SELECT r FROM Role r WHERE r.server.id = :serverId AND r.name = :name")
    Optional<Role> findByServerIdAndName(@Param("serverId") Long serverId, @Param("name") String name);
}
