package vn.cococord.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.cococord.entity.mysql.FriendRequest;
import vn.cococord.entity.mysql.FriendRequest.FriendRequestStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface IFriendRequestRepository extends JpaRepository<FriendRequest, Long> {

    /**
     * Find all friend requests sent by a user
     */
    List<FriendRequest> findBySenderIdOrderByCreatedAtDesc(Long senderId);

    /**
     * Find all friend requests received by a user
     */
    List<FriendRequest> findByReceiverIdOrderByCreatedAtDesc(Long receiverId);

    /**
     * Find pending requests received by a user
     */
    List<FriendRequest> findByReceiverIdAndStatus(Long receiverId, FriendRequestStatus status);

    /**
     * Find pending requests sent by a user
     */
    List<FriendRequest> findBySenderIdAndStatus(Long senderId, FriendRequestStatus status);

    /**
     * Find request between two users
     */
    @Query("SELECT fr FROM FriendRequest fr WHERE " +
            "(fr.sender.id = :userId1 AND fr.receiver.id = :userId2) OR " +
            "(fr.sender.id = :userId2 AND fr.receiver.id = :userId1)")
    Optional<FriendRequest> findBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /**
     * Check if users are friends (accepted request exists)
     */
    @Query("SELECT CASE WHEN COUNT(fr) > 0 THEN true ELSE false END FROM FriendRequest fr WHERE " +
            "fr.status = 'ACCEPTED' AND " +
            "((fr.sender.id = :userId1 AND fr.receiver.id = :userId2) OR " +
            "(fr.sender.id = :userId2 AND fr.receiver.id = :userId1))")
    boolean areFriends(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /**
     * Find all accepted friend requests for a user (as sender or receiver)
     */
    @Query("SELECT fr FROM FriendRequest fr WHERE fr.status = 'ACCEPTED' AND " +
            "(fr.sender.id = :userId OR fr.receiver.id = :userId)")
    List<FriendRequest> findAcceptedFriendships(@Param("userId") Long userId);

    /**
     * Check if pending request exists
     */
    boolean existsBySenderIdAndReceiverIdAndStatus(Long senderId, Long receiverId, FriendRequestStatus status);
}
