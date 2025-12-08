package vn.cococord.repository;

import vn.cococord.entity.AuditLog;
import vn.cococord.entity.AuditLog.AuditAction;
import vn.cococord.entity.Server;
import vn.cococord.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByServerOrderByCreatedAtDesc(Server server);

    Page<AuditLog> findByServer(Server server, Pageable pageable);

    List<AuditLog> findByUserOrderByCreatedAtDesc(User user);

    Page<AuditLog> findByUser(User user, Pageable pageable);

    List<AuditLog> findByActionAndCreatedAtAfter(AuditAction action, Instant after);

    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
