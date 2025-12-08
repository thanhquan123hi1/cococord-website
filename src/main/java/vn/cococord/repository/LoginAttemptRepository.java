package vn.cococord.repository;

import vn.cococord.entity.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.List;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {
    List<LoginAttempt> findByUsernameAndAttemptTimeAfter(String username, Instant after);

    List<LoginAttempt> findByIpAddressAndAttemptTimeAfter(String ipAddress, Instant after);

    @Query("SELECT COUNT(l) FROM LoginAttempt l WHERE l.username = ?1 AND l.success = false AND l.attemptTime > ?2")
    long countFailedAttempts(String username, Instant after);

    @Query("SELECT COUNT(l) FROM LoginAttempt l WHERE l.ipAddress = ?1 AND l.success = false AND l.attemptTime > ?2")
    long countFailedAttemptsByIp(String ipAddress, Instant after);
}
