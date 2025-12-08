package vn.cococord.repository;

import vn.cococord.entity.Role;
import vn.cococord.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {
    List<RolePermission> findByRole(Role role);

    @Modifying
    void deleteByRole(Role role);
}
