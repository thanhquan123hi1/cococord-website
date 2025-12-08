package vn.cococord.repository;

import vn.cococord.entity.Role;
import vn.cococord.entity.Server;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    List<Role> findByServerOrderByPositionDesc(Server server);

    Optional<Role> findByServerAndIsDefaultTrue(Server server);

    Optional<Role> findByServerAndName(Server server, String name);
}
