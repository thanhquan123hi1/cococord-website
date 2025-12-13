package vn.cococord.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.cococord.entity.mysql.BlockedUser;

import java.util.List;
import java.util.Optional;

@Repository
public interface IBlockedUserRepository extends JpaRepository<BlockedUser, Long> {

    /**
     * Find all users blocked by a specific user
     */
    List<BlockedUser> findByUserIdOrderByBlockedAtDesc(Long userId);

    /**
     * Check if user A has blocked user B
     */
    boolean existsByUserIdAndBlockedUserId(Long userId, Long blockedUserId);

    /**
     * Find block record between two users
     */
    Optional<BlockedUser> findByUserIdAndBlockedUserId(Long userId, Long blockedUserId);

    /**
     * Delete block record
     */
    void deleteByUserIdAndBlockedUserId(Long userId, Long blockedUserId);
}
