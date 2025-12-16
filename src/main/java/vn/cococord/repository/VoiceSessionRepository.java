package vn.cococord.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import vn.cococord.entity.mongodb.VoiceSession;

@Repository
public interface VoiceSessionRepository extends MongoRepository<VoiceSession, String> {

    /**
     * Find active voice session for a channel
     */
    Optional<VoiceSession> findByChannelIdAndIsActiveTrue(Long channelId);

    /**
     * Find all active voice sessions for a server
     */
    List<VoiceSession> findByServerIdAndIsActiveTrue(Long serverId);

    /**
     * Find all voice sessions for a channel (history)
     */
    List<VoiceSession> findByChannelIdOrderByStartedAtDesc(Long channelId);
}
