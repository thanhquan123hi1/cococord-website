package vn.cococord.repository;

import vn.cococord.entity.ServerBan;
import vn.cococord.entity.Server;
import vn.cococord.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface ServerBanRepository extends JpaRepository<ServerBan, Long> {
    Optional<ServerBan> findByServerAndUser(Server server, User user);

    boolean existsByServerAndUser(Server server, User user);

    List<ServerBan> findByServer(Server server);

    void deleteByServerAndUser(Server server, User user);
}
