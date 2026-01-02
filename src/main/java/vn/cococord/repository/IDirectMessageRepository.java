package vn.cococord.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import vn.cococord.entity.mongodb.DirectMessage;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IDirectMessageRepository extends MongoRepository<DirectMessage, String> {

        /**
         * Find messages in a DM group with pagination
         */
        Page<DirectMessage> findByDmGroupIdAndIsDeletedFalseOrderByCreatedAtDesc(Long dmGroupId, Pageable pageable);

        /**
         * Find messages after a specific message (for real-time updates)
         */
        List<DirectMessage> findByDmGroupIdAndCreatedAtAfterAndIsDeletedFalseOrderByCreatedAtAsc(
                        Long dmGroupId, LocalDateTime after);

        /**
         * Count unread messages for a user in a DM group
         */
        @Query("{ 'dmGroupId': ?0, 'createdAt': { $gt: ?1 }, 'senderId': { $ne: ?2 }, 'isDeleted': false }")
        long countUnreadMessages(Long dmGroupId, LocalDateTime lastReadAt, Long userId);

        /**
         * Search messages in DM group
         */
        @Query("{ 'dmGroupId': ?0, 'content': { $regex: ?1, $options: 'i' }, 'isDeleted': false }")
        List<DirectMessage> searchInDmGroup(Long dmGroupId, String searchTerm);

        /**
         * Find messages by sender in DM group
         */
        List<DirectMessage> findByDmGroupIdAndSenderIdAndIsDeletedFalseOrderByCreatedAtDesc(
                        Long dmGroupId, Long senderId, Pageable pageable);

        /**
         * Delete all messages in a DM group (soft delete)
         */
        @Query(value = "{ 'dmGroupId': ?0 }", delete = true)
        void deleteAllByDmGroupId(Long dmGroupId);

        boolean existsByDmGroupIdAndCallId(Long dmGroupId, String callId);
}
