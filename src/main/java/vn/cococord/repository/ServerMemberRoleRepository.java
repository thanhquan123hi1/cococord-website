package vn.cococord.repository;

import vn.cococord.entity.ServerMemberRole;
import vn.cococord.entity.ServerMember;
import vn.cococord.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import java.util.List;

public interface ServerMemberRoleRepository extends JpaRepository<ServerMemberRole, Long> {
    List<ServerMemberRole> findByServerMember(ServerMember serverMember);

    List<ServerMemberRole> findByRole(Role role);

    boolean existsByServerMemberAndRole(ServerMember serverMember, Role role);

    @Modifying
    void deleteByServerMemberAndRole(ServerMember serverMember, Role role);

    @Modifying
    void deleteByServerMember(ServerMember serverMember);

    @Modifying
    void deleteByRole(Role role);

    long countByRole(Role role);
}
