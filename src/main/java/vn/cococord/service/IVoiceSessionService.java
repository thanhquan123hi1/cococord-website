package vn.cococord.service;

import java.util.Optional;

import vn.cococord.entity.mongodb.VoiceSession;

public interface IVoiceSessionService {

    Optional<VoiceSession> findActiveSession(Long channelId);

    VoiceSession getOrCreateActiveSession(Long channelId, Long serverId);

    VoiceSession save(VoiceSession session);
}
