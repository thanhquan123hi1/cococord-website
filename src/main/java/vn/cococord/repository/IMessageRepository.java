package vn.cococord.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import vn.cococord.entity.mongodb.Message;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IMessageRepository extends MongoRepository<Message, String> {

    Page<Message> findByChannelIdOrderByCreatedAtDesc(Long channelId, Pageable pageable);

    List<Message> findByChannelIdAndCreatedAtAfterOrderByCreatedAtAsc(Long channelId, LocalDateTime since);

    @Query("{ 'channelId': ?0, 'createdAt': { $lt: ?1 } }")
    Page<Message> findByChannelIdBeforeTimestamp(Long channelId, LocalDateTime timestamp, Pageable pageable);

    List<Message> findByParentMessageIdOrderByCreatedAtAsc(String parentMessageId);

    @Query("{ 'channelId': ?0, 'userId': ?1 }")
    List<Message> findByChannelIdAndUserId(Long channelId, Long userId);

    long countByChannelId(Long channelId);

    void deleteByChannelId(Long channelId);
}
