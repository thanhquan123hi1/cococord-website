package vn.cococord.repository;

import vn.cococord.entity.User;
import vn.cococord.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    List<User> findByUsernameContainingIgnoreCaseAndUsernameNot(String username, String excludeUsername);

    Page<User> findByUsernameContainingIgnoreCase(String username, Pageable pageable);

    long countByStatus(UserStatus status);

    long countByCreatedAtAfter(LocalDateTime dateTime);
}
