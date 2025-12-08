package vn.cococord.repository;

import vn.cococord.entity.Server;
import vn.cococord.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServerRepository extends JpaRepository<Server, Long> {
    List<Server> findByOwner(User owner);

    Page<Server> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
