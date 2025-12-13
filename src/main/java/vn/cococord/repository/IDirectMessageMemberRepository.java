package vn.cococord.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.cococord.entity.mysql.DirectMessageMember;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface IDirectMessageMemberRepository extends JpaRepository<DirectMessageMember, Long> {

    /**
     * Find all members of a DM group
     */
    List<DirectMessageMember> findByDmGroupId(Long dmGroupId);

    /**
     * Find specific member in a DM group
     */
    Optional<DirectMessageMember> findByDmGroupIdAndUserId(Long dmGroupId, Long userId);

    /**
     * Delete member from DM group
     */
    void deleteByDmGroupIdAndUserId(Long dmGroupId, Long userId);

    /**
     * Update last read timestamp
     */
    @Modifying
    @Query("UPDATE DirectMessageMember m SET m.lastReadAt = :timestamp WHERE m.dmGroup.id = :dmGroupId AND m.user.id = :userId")
    void updateLastReadAt(@Param("dmGroupId") Long dmGroupId, @Param("userId") Long userId,
            @Param("timestamp") LocalDateTime timestamp);

    /**
     * Check if user is member
     */
    boolean existsByDmGroupIdAndUserId(Long dmGroupId, Long userId);

    /**
     * Get unread count for user
     */
    @Query("SELECT COUNT(m) FROM DirectMessageMember m WHERE m.user.id = :userId AND m.lastReadAt < :lastMessageTime")
    long countUnreadForUser(@Param("userId") Long userId, @Param("lastMessageTime") LocalDateTime lastMessageTime);
}
