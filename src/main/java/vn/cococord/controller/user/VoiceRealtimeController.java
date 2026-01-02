package vn.cococord.controller.user;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.request.VoicePresenceJoinRequest;
import vn.cococord.dto.request.VoicePresenceLeaveRequest;
import vn.cococord.dto.request.VoiceSignalAnswerRequest;
import vn.cococord.dto.request.VoiceSignalIceRequest;
import vn.cococord.dto.request.VoiceSignalOfferRequest;
import vn.cococord.dto.request.VoiceStateUpdateRequest;
import vn.cococord.entity.mysql.User;
import vn.cococord.repository.IUserRepository;
import vn.cococord.service.voice.VoiceRoomRegistry;

@Controller
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class VoiceRealtimeController {

    private final SimpMessagingTemplate messagingTemplate;
    private final IUserRepository userRepository;
    private final VoiceRoomRegistry voiceRoomRegistry;

    private static String topic(long channelId) {
        return "/topic/voice/" + channelId;
    }

    private static String signalTopic(long channelId) {
        return "/topic/voice/" + channelId + "/signal";
    }

    @MessageMapping("/voice/join")
    public void join(
            @Payload VoicePresenceJoinRequest request,
            Principal principal,
            SimpMessageHeaderAccessor headerAccessor) {
        if (request == null || request.getChannelId() == null) return;
        if (principal == null) return;

        long channelId = request.getChannelId();
        String sessionId = headerAccessor != null ? headerAccessor.getSessionId() : null;

        try {
            String username = principal.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            VoiceRoomRegistry.VoiceMemberState member = VoiceRoomRegistry.VoiceMemberState.builder()
                    .userId(user.getId())
                    .username(user.getUsername())
                    .displayName(user.getDisplayName())
                    .avatarUrl(user.getAvatarUrl())
                    .micOn(true)
                    .camOn(false)
                    .speaking(false)
                    .build();

            List<VoiceRoomRegistry.VoiceMemberState> users = voiceRoomRegistry.join(channelId, member, sessionId);

            log.info("[VOICE] JOIN channelId={} userId={} username={} sessionId={}", channelId, user.getId(), user.getUsername(), sessionId);

            Map<String, Object> joinEvt = new HashMap<>();
            joinEvt.put("type", "USER_JOIN");
            joinEvt.put("channelId", channelId);
            joinEvt.put("user", member);
            messagingTemplate.convertAndSend(topic(channelId), joinEvt);

            Map<String, Object> usersEvt = new HashMap<>();
            usersEvt.put("type", "VOICE_USERS");
            usersEvt.put("channelId", channelId);
            usersEvt.put("users", users);
            messagingTemplate.convertAndSend(topic(channelId), usersEvt);

        } catch (Exception e) {
            log.error("[VOICE] JOIN failed channelId={} err={}", channelId, e.getMessage(), e);
        }
    }

    @MessageMapping("/voice/leave")
    public void leave(@Payload VoicePresenceLeaveRequest request, Principal principal) {
        if (request == null || request.getChannelId() == null) return;
        if (principal == null) return;

        long channelId = request.getChannelId();

        try {
            String username = principal.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<VoiceRoomRegistry.VoiceMemberState> users = voiceRoomRegistry.leave(channelId, user.getId());

            log.info("[VOICE] LEAVE channelId={} userId={} username={}", channelId, user.getId(), user.getUsername());

            Map<String, Object> leaveEvt = new HashMap<>();
            leaveEvt.put("type", "USER_LEAVE");
            leaveEvt.put("channelId", channelId);
            leaveEvt.put("userId", user.getId());
            messagingTemplate.convertAndSend(topic(channelId), leaveEvt);

            Map<String, Object> usersEvt = new HashMap<>();
            usersEvt.put("type", "VOICE_USERS");
            usersEvt.put("channelId", channelId);
            usersEvt.put("users", users);
            messagingTemplate.convertAndSend(topic(channelId), usersEvt);

        } catch (Exception e) {
            log.error("[VOICE] LEAVE failed channelId={} err={}", channelId, e.getMessage(), e);
        }
    }

    @MessageMapping("/voice/state")
    public void updateState(@Payload VoiceStateUpdateRequest request, Principal principal) {
        if (request == null || request.getChannelId() == null) return;
        if (principal == null) return;

        long channelId = request.getChannelId();

        try {
            String username = principal.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

                voiceRoomRegistry.updateState(channelId, user.getId(), request.getMicOn(), request.getCamOn(), request.getScreenOn(), request.getSpeaking());

            Map<String, Object> evt = new HashMap<>();
            evt.put("type", "VOICE_STATE_UPDATE");
            evt.put("channelId", channelId);
            evt.put("userId", user.getId());
            evt.put("micOn", request.getMicOn());
            evt.put("camOn", request.getCamOn());
            evt.put("screenOn", request.getScreenOn());
            evt.put("speaking", request.getSpeaking());
            messagingTemplate.convertAndSend(topic(channelId), evt);

        } catch (Exception e) {
            log.error("[VOICE] STATE failed channelId={} err={}", channelId, e.getMessage(), e);
        }
    }

    // ==================== SIGNALING ====================

    @MessageMapping("/voice/signal/offer")
    public void offer(@Payload VoiceSignalOfferRequest request, Principal principal) {
        if (request == null || request.getChannelId() == null) return;
        if (principal == null) return;

        long channelId = request.getChannelId();
        try {
            Map<String, Object> evt = new HashMap<>();
            evt.put("type", "OFFER");
            evt.put("channelId", channelId);
            evt.put("fromUserId", request.getFromUserId());
            evt.put("toUserId", request.getToUserId());
            evt.put("sdp", request.getSdp());

            log.debug("[SIGNAL] OFFER channelId={} from={} to={}", channelId, request.getFromUserId(), request.getToUserId());
            messagingTemplate.convertAndSend(signalTopic(channelId), evt);
        } catch (Exception e) {
            log.error("[SIGNAL] OFFER failed channelId={} err={}", channelId, e.getMessage(), e);
        }
    }

    @MessageMapping("/voice/signal/answer")
    public void answer(@Payload VoiceSignalAnswerRequest request, Principal principal) {
        if (request == null || request.getChannelId() == null) return;
        if (principal == null) return;

        long channelId = request.getChannelId();
        try {
            Map<String, Object> evt = new HashMap<>();
            evt.put("type", "ANSWER");
            evt.put("channelId", channelId);
            evt.put("fromUserId", request.getFromUserId());
            evt.put("toUserId", request.getToUserId());
            evt.put("sdp", request.getSdp());

            log.debug("[SIGNAL] ANSWER channelId={} from={} to={}", channelId, request.getFromUserId(), request.getToUserId());
            messagingTemplate.convertAndSend(signalTopic(channelId), evt);
        } catch (Exception e) {
            log.error("[SIGNAL] ANSWER failed channelId={} err={}", channelId, e.getMessage(), e);
        }
    }

    @MessageMapping("/voice/signal/ice")
    public void ice(@Payload VoiceSignalIceRequest request, Principal principal) {
        if (request == null || request.getChannelId() == null) return;
        if (principal == null) return;

        long channelId = request.getChannelId();
        try {
            Map<String, Object> evt = new HashMap<>();
            evt.put("type", "ICE");
            evt.put("channelId", channelId);
            evt.put("fromUserId", request.getFromUserId());
            evt.put("toUserId", request.getToUserId());
            evt.put("candidate", request.getCandidate());

            log.debug("[SIGNAL] ICE channelId={} from={} to={}", channelId, request.getFromUserId(), request.getToUserId());
            messagingTemplate.convertAndSend(signalTopic(channelId), evt);
        } catch (Exception e) {
            log.error("[SIGNAL] ICE failed channelId={} err={}", channelId, e.getMessage(), e);
        }
    }
}
