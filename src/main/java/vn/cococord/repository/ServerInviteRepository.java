package vn.cococord.repository;

import vn.cococord.entity.ServerInvite;
import vn.cococord.entity.Server;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface ServerInviteRepository extends JpaRepository<ServerInvite, Long> {
    Optional<ServerInvite> findByCode(String code);

    Optional<ServerInvite> findByCodeAndActiveTrue(String code);

    List<ServerInvite> findByServerAndActiveTrue(Server server);

    List<ServerInvite> findByServer(Server server);
}
