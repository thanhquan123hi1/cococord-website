package vn.cococord.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import vn.cococord.entity.mongodb.ForumPost;

@Repository
public interface IForumPostRepository extends MongoRepository<ForumPost, String> {

    /**
     * Find all posts in a forum channel, ordered by pinned first then newest
     */
    List<ForumPost> findByChannelIdOrderByIsPinnedDescCreatedAtDesc(Long channelId);

    /**
     * Find posts in a forum channel with pagination
     */
    Page<ForumPost> findByChannelIdOrderByIsPinnedDescCreatedAtDesc(Long channelId, Pageable pageable);

    /**
     * Find posts by author
     */
    List<ForumPost> findByAuthorIdOrderByCreatedAtDesc(Long authorId);

    /**
     * Count posts in a channel
     */
    long countByChannelId(Long channelId);

    /**
     * Delete all posts in a channel (when channel is deleted)
     */
    void deleteAllByChannelId(Long channelId);
}
