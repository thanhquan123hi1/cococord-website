package vn.cococord.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.cococord.entity.mysql.DirectMessageGroup;

import java.util.List;
import java.util.Optional;

@Repository
public interface IDirectMessageGroupRepository extends JpaRepository<DirectMessageGroup, Long> {

    /**
     * Find all DM groups that a user is a member of
     */
    @Query("SELECT DISTINCT dmg FROM DirectMessageGroup dmg " +
            "JOIN dmg.members m " +
            "WHERE m.user.id = :userId " +
            "ORDER BY dmg.updatedAt DESC")
    List<DirectMessageGroup> findAllByUserId(@Param("userId") Long userId);

    /**
     * Find 1-1 DM between two users
     */
    @Query("SELECT dmg FROM DirectMessageGroup dmg " +
            "WHERE dmg.isGroup = false " +
            "AND EXISTS (SELECT 1 FROM DirectMessageMember m1 WHERE m1.dmGroup = dmg AND m1.user.id = :userId1) " +
            "AND EXISTS (SELECT 1 FROM DirectMessageMember m2 WHERE m2.dmGroup = dmg AND m2.user.id = :userId2)")
    Optional<DirectMessageGroup> findOneToOneDM(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /**
     * Find group DMs created by a user
     */
    List<DirectMessageGroup> findByOwnerIdAndIsGroupTrue(Long ownerId);

    /**
     * Check if user is member of DM group
     */
    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END " +
            "FROM DirectMessageMember m " +
            "WHERE m.dmGroup.id = :dmGroupId AND m.user.id = :userId")
    boolean isUserMemberOfGroup(@Param("dmGroupId") Long dmGroupId, @Param("userId") Long userId);

    /**
     * Count members in a DM group
     */
    @Query("SELECT COUNT(m) FROM DirectMessageMember m WHERE m.dmGroup.id = :dmGroupId")
    long countMembersByDmGroupId(@Param("dmGroupId") Long dmGroupId);
}
