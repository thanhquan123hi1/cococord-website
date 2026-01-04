package vn.cococord.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.cococord.entity.mysql.User;
import vn.cococord.entity.mysql.User.UserStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface IUserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameOrEmail(String username, String email);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

    Optional<User> findByResetPasswordToken(String token);

    // Admin queries
    Page<User> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String username, String email, Pageable pageable);

    long countByIsBannedTrue();

    long countByIsActiveTrue();

    long countByStatus(UserStatus status);

    // Dashboard statistics
    long countByCreatedAtAfter(LocalDateTime date);

    long countByLastLoginAfter(LocalDateTime date);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :startDate AND u.createdAt < :endDate")
    long countByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT DATE(u.createdAt) as date, COUNT(u) as count FROM User u " +
            "WHERE u.createdAt >= :startDate GROUP BY DATE(u.createdAt) ORDER BY date")
    List<Object[]> countNewUsersByDay(@Param("startDate") LocalDateTime startDate);

    // Find recent users
    List<User> findTop10ByOrderByCreatedAtDesc();

    // Muted users
    @Query("SELECT u FROM User u WHERE u.isMuted = true")
    List<User> findMutedUsers();
}
