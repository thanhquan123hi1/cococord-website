package vn.cococord.repository;

import vn.cococord.entity.Channel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChannelRepository extends JpaRepository<Channel, Long> {
    java.util.List<Channel> findByServer(vn.cococord.entity.Server server);
}
