package vn.cococord.repository;

import vn.cococord.entity.ServerMember;
import vn.cococord.entity.Server;
import vn.cococord.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ServerMemberRepository extends JpaRepository<ServerMember, Long> {
    List<ServerMember> findByUser(User user);

    List<ServerMember> findByServer(Server server);

    Optional<ServerMember> findByServerAndUser(Server server, User user);

    boolean existsByServerAndUser(Server server, User user);

    long countByServer(Server server);
}
