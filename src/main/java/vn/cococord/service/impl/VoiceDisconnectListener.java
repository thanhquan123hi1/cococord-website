package vn.cococord.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.context.event.EventListener;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.entity.voice.VoiceMemberState;
import vn.cococord.service.IVoiceRoomRegistry;

@Component
@RequiredArgsConstructor
@Slf4j
public class VoiceDisconnectListener {

    private final IVoiceRoomRegistry voiceRoomRegistry;
    private final SimpMessagingTemplate messagingTemplate;

    private static @NonNull String topic(long channelId) {
        return "/topic/voice/" + channelId;
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        if (event == null)
            return;
        String sessionId = Objects.requireNonNull(event.getSessionId(), "sessionId");

        voiceRoomRegistry.removeBySessionId(sessionId).ifPresent(membership -> {
            long channelId = membership.getChannelId();
            long userId = membership.getUserId();

            log.info("[VOICE] DISCONNECT sessionId={} channelId={} userId={}", sessionId, channelId, userId);

            Map<String, Object> leaveEvt = new HashMap<>();
            leaveEvt.put("type", "USER_LEAVE");
            leaveEvt.put("channelId", channelId);
            leaveEvt.put("userId", userId);
            messagingTemplate.convertAndSend(topic(channelId), leaveEvt);

            List<VoiceMemberState> users = voiceRoomRegistry.snapshot(channelId);
            Map<String, Object> usersEvt = new HashMap<>();
            usersEvt.put("type", "VOICE_USERS");
            usersEvt.put("channelId", channelId);
            usersEvt.put("users", users);
            messagingTemplate.convertAndSend(topic(channelId), usersEvt);
        });
    }
}