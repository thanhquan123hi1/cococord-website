package vn.cococord.repository;

import java.util.List;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.cococord.entity.mysql.RolePermission;

@Repository
public interface IRolePermissionRepository extends JpaRepository<RolePermission, Long> {
    
    @Query("SELECT rp FROM RolePermission rp WHERE rp.role.id = :roleId")
    List<RolePermission> findByRoleId(@Param("roleId") Long roleId);
    
    @Query("SELECT rp FROM RolePermission rp WHERE rp.role.id = :roleId AND rp.isAllowed = true")
    List<RolePermission> findAllowedByRoleId(@Param("roleId") Long roleId);
    
    @Query("SELECT rp.permission.name FROM RolePermission rp " +
           "WHERE rp.role.id = :roleId AND rp.isAllowed = true")
    Set<String> findPermissionNamesByRoleId(@Param("roleId") Long roleId);
    
    @Query("SELECT DISTINCT rp.permission.name FROM RolePermission rp " +
           "JOIN rp.role r " +
           "JOIN r.members sm " +
           "WHERE sm.user.id = :userId AND r.server.id = :serverId AND rp.isAllowed = true")
    Set<String> findPermissionNamesByUserIdAndServerId(@Param("userId") Long userId, @Param("serverId") Long serverId);
    
    @Query("SELECT COUNT(rp) > 0 FROM RolePermission rp " +
           "JOIN rp.role r " +
           "JOIN r.members sm " +
           "WHERE sm.user.id = :userId AND r.server.id = :serverId " +
           "AND rp.permission.name = :permissionName AND rp.isAllowed = true")
    boolean hasPermission(@Param("userId") Long userId, @Param("serverId") Long serverId, @Param("permissionName") String permissionName);
    
    void deleteByRoleId(Long roleId);
}
