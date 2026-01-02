package vn.cococord.service.impl;

import java.util.Optional;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import vn.cococord.entity.mongodb.VoiceSession;
import vn.cococord.repository.IVoiceSessionRepository;
import vn.cococord.service.IVoiceSessionService;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class VoiceSessionServiceImpl implements IVoiceSessionService {

    private final IVoiceSessionRepository voiceSessionRepository;

    @Override
    public Optional<VoiceSession> findActiveSession(Long channelId) {
        return voiceSessionRepository.findByChannelIdAndIsActiveTrue(channelId);
    }

    @Override
    public VoiceSession getOrCreateActiveSession(Long channelId, Long serverId) {
        return voiceSessionRepository.findByChannelIdAndIsActiveTrue(channelId)
                .orElseGet(() -> VoiceSession.builder()
                        .channelId(channelId)
                        .serverId(serverId)
                        .isActive(true)
                        .build());
    }

    @Override
    public VoiceSession save(VoiceSession session) {
        return voiceSessionRepository.save(session);
    }
}
