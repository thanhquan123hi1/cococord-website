package vn.cococord.controller.user;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.request.VoiceJoinRequest;
import vn.cococord.dto.request.VoiceCameraRequest;
import vn.cococord.dto.request.VoiceMuteRequest;
import vn.cococord.dto.request.VoiceScreenRequest;
import vn.cococord.dto.request.VoiceSpeakingRequest;
import vn.cococord.entity.mongodb.VoiceSession;
import vn.cococord.entity.mysql.User;
import vn.cococord.service.IUserService;
import vn.cococord.service.IVoiceSessionService;

/**
 * WebSocket Controller for Voice Channel functionality
 * Handles voice join/leave and signaling
 */
@Controller
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class VoiceController {

    private final SimpMessagingTemplate messagingTemplate;
    private final IVoiceSessionService voiceSessionService;
    private final IUserService userService;

    /**
     * Join voice channel
     * Client sends to: /app/voice.join
     * Broadcast to: /topic/voice/{channelId}
     */
    @MessageMapping("/voice.join")
    public void joinVoice(@Payload VoiceJoinRequest request, Principal principal) {
        try {
            String username = principal.getName();
            log.info("User {} joining voice channel {}", username, request.getChannelId());

            User user = userService.getUserByUsername(username);

            // Find or create voice session for this channel
            VoiceSession session = voiceSessionService.getOrCreateActiveSession(
                    request.getChannelId(),
                    request.getServerId());

            // Remove user if already in (reconnecting)
            session.getParticipants().removeIf(p -> p.getUserId().equals(user.getId()));

            // Add participant
            VoiceSession.VoiceParticipant participant = VoiceSession.VoiceParticipant.builder()
                    .userId(user.getId())
                    .username(user.getUsername())
                    .displayName(user.getDisplayName())
                    .avatarUrl(user.getAvatarUrl())
                    .connectionId(request.getPeerId())
                    .isMuted(false)
                    .isDeafened(false)
                    .isSpeaking(false)
                    .isCameraOn(false)
                    .isScreenSharing(false)
                    .joinedAt(LocalDateTime.now())
                    .build();

            session.getParticipants().add(participant);
            voiceSessionService.save(session);

            // Broadcast user joined
            Map<String, Object> joinEvent = new HashMap<>();
            joinEvent.put("type", "USER_JOINED");
            joinEvent.put("userId", user.getId());
            joinEvent.put("username", user.getUsername());
            joinEvent.put("displayName", user.getDisplayName());
            joinEvent.put("avatarUrl", user.getAvatarUrl());
            joinEvent.put("peerId", request.getPeerId());

            messagingTemplate.convertAndSend(
                    "/topic/voice/" + request.getChannelId(),
                    joinEvent);

            // Send current participants list
            Map<String, Object> participantsUpdate = new HashMap<>();
            participantsUpdate.put("type", "PARTICIPANTS_UPDATE");
            participantsUpdate.put("participants", session.getParticipants());

            messagingTemplate.convertAndSend(
                    "/topic/voice/" + request.getChannelId(),
                    participantsUpdate);

            log.info("User {} joined voice channel {}", username, request.getChannelId());
        } catch (Exception e) {
            log.error("Error joining voice: {}", e.getMessage(), e);
        }
    }

    /**
     * Leave voice channel
     * Client sends to: /app/voice.leave
     */
    @MessageMapping("/voice.leave")
    public void leaveVoice(@Payload VoiceJoinRequest request, Principal principal) {
        try {
            String username = principal.getName();
            log.info("User {} leaving voice channel {}", username, request.getChannelId());

            User user = userService.getUserByUsername(username);

            Optional<VoiceSession> sessionOpt = voiceSessionService.findActiveSession(request.getChannelId());

            if (sessionOpt.isPresent()) {
                VoiceSession session = sessionOpt.get();

                // Mark user as left
                session.getParticipants().stream()
                        .filter(p -> p.getUserId().equals(user.getId()))
                        .findFirst()
                        .ifPresent(p -> p.setLeftAt(LocalDateTime.now()));

                // Remove from active list
                session.getParticipants().removeIf(p -> p.getUserId().equals(user.getId()));

                // If no participants left, end session
                if (session.getParticipants().isEmpty()) {
                    session.setIsActive(false);
                    session.setEndedAt(LocalDateTime.now());
                }

                voiceSessionService.save(session);

                // Broadcast user left
                Map<String, Object> leaveEvent = new HashMap<>();
                leaveEvent.put("type", "USER_LEFT");
                leaveEvent.put("userId", user.getId());
                leaveEvent.put("username", user.getUsername());
                leaveEvent.put("peerId", request.getPeerId());

                messagingTemplate.convertAndSend(
                        "/topic/voice/" + request.getChannelId(),
                        leaveEvent);

                // Send updated participants list
                Map<String, Object> participantsUpdate = new HashMap<>();
                participantsUpdate.put("type", "PARTICIPANTS_UPDATE");
                participantsUpdate.put("participants", session.getParticipants());

                messagingTemplate.convertAndSend(
                        "/topic/voice/" + request.getChannelId(),
                        participantsUpdate);
            }

            log.info("User {} left voice channel {}", username, request.getChannelId());
        } catch (Exception e) {
            log.error("Error leaving voice: {}", e.getMessage(), e);
        }
    }

    /**
     * Toggle mute
     * Client sends to: /app/voice.mute
     */
    @MessageMapping("/voice.mute")
    public void toggleMute(@Payload VoiceMuteRequest request, Principal principal) {
        try {
            String username = principal.getName();
            User user = userService.getUserByUsername(username);

            Optional<VoiceSession> sessionOpt = voiceSessionService.findActiveSession(request.getChannelId());

            if (sessionOpt.isPresent()) {
                VoiceSession session = sessionOpt.get();

                final Map<String, Object> muteEvent = new HashMap<>();
                muteEvent.put("type", "USER_MUTE");
                muteEvent.put("userId", user.getId());
                muteEvent.put("isMuted", request.getIsMuted());

                session.getParticipants().stream()
                        .filter(p -> p.getUserId().equals(user.getId()))
                        .findFirst()
                        .ifPresent(p -> {
                            p.setIsMuted(request.getIsMuted());
                            if (Boolean.TRUE.equals(request.getIsMuted())) {
                                p.setIsSpeaking(false);
                            }
                            muteEvent.put("peerId", p.getConnectionId());
                        });

                voiceSessionService.save(session);

                messagingTemplate.convertAndSend(
                        "/topic/voice/" + request.getChannelId(),
                        muteEvent);
            }
        } catch (Exception e) {
            log.error("Error toggling mute: {}", e.getMessage(), e);
        }
    }

    /**
     * Toggle deafen
     * Client sends to: /app/voice.deafen
     */
    @MessageMapping("/voice.deafen")
    public void toggleDeafen(@Payload VoiceMuteRequest request, Principal principal) {
        try {
            String username = principal.getName();
            User user = userService.getUserByUsername(username);

            Optional<VoiceSession> sessionOpt = voiceSessionService.findActiveSession(request.getChannelId());

            if (sessionOpt.isPresent()) {
                VoiceSession session = sessionOpt.get();

                final Map<String, Object> deafenEvent = new HashMap<>();
                deafenEvent.put("type", "USER_DEAFEN");
                deafenEvent.put("userId", user.getId());
                deafenEvent.put("isDeafened", request.getIsDeafened());
                deafenEvent.put("isMuted", request.getIsMuted());

                session.getParticipants().stream()
                        .filter(p -> p.getUserId().equals(user.getId()))
                        .findFirst()
                        .ifPresent(p -> {
                            p.setIsDeafened(request.getIsDeafened());
                            if (request.getIsMuted() != null) {
                                p.setIsMuted(request.getIsMuted());
                            }
                            if (Boolean.TRUE.equals(request.getIsMuted())) {
                                p.setIsSpeaking(false);
                            }
                            deafenEvent.put("peerId", p.getConnectionId());
                        });

                voiceSessionService.save(session);

                messagingTemplate.convertAndSend(
                        "/topic/voice/" + request.getChannelId(),
                        deafenEvent);
            }
        } catch (Exception e) {
            log.error("Error toggling deafen: {}", e.getMessage(), e);
        }
    }

    /**
     * Toggle camera
     * Client sends to: /app/voice.camera
     */
    @MessageMapping("/voice.camera")
    public void toggleCamera(@Payload VoiceCameraRequest request, Principal principal) {
        try {
            String username = principal.getName();
            User user = userService.getUserByUsername(username);

            Optional<VoiceSession> sessionOpt = voiceSessionService.findActiveSession(request.getChannelId());

            if (sessionOpt.isPresent()) {
                VoiceSession session = sessionOpt.get();

                final Map<String, Object> cameraEvent = new HashMap<>();
                cameraEvent.put("type", "USER_CAMERA");
                cameraEvent.put("userId", user.getId());
                cameraEvent.put("isCameraOn", request.getIsCameraOn());

                session.getParticipants().stream()
                        .filter(p -> p.getUserId().equals(user.getId()))
                        .findFirst()
                        .ifPresent(p -> {
                            p.setIsCameraOn(Boolean.TRUE.equals(request.getIsCameraOn()));
                            cameraEvent.put("peerId", p.getConnectionId());
                        });

                voiceSessionService.save(session);

                messagingTemplate.convertAndSend(
                        "/topic/voice/" + request.getChannelId(),
                        cameraEvent);

                Map<String, Object> participantsUpdate = new HashMap<>();
                participantsUpdate.put("type", "PARTICIPANTS_UPDATE");
                participantsUpdate.put("participants", session.getParticipants());

                messagingTemplate.convertAndSend(
                        "/topic/voice/" + request.getChannelId(),
                        participantsUpdate);
            }
        } catch (Exception e) {
            log.error("Error toggling camera: {}", e.getMessage(), e);
        }
    }

    /**
     * Toggle screen sharing
     * Client sends to: /app/voice.screen
     */
    @MessageMapping("/voice.screen")
    public void toggleScreen(@Payload VoiceScreenRequest request, Principal principal) {
        try {
            String username = principal.getName();
            User user = userService.getUserByUsername(username);

            Optional<VoiceSession> sessionOpt = voiceSessionService.findActiveSession(request.getChannelId());

            if (sessionOpt.isPresent()) {
                VoiceSession session = sessionOpt.get();

                final Map<String, Object> screenEvent = new HashMap<>();
                screenEvent.put("type", "USER_SCREEN");
                screenEvent.put("userId", user.getId());
                screenEvent.put("isScreenSharing", request.getIsScreenSharing());

                session.getParticipants().stream()
                        .filter(p -> p.getUserId().equals(user.getId()))
                        .findFirst()
                        .ifPresent(p -> {
                            p.setIsScreenSharing(Boolean.TRUE.equals(request.getIsScreenSharing()));
                            screenEvent.put("peerId", p.getConnectionId());
                        });

                voiceSessionService.save(session);

                messagingTemplate.convertAndSend(
                        "/topic/voice/" + request.getChannelId(),
                        screenEvent);

                Map<String, Object> participantsUpdate = new HashMap<>();
                participantsUpdate.put("type", "PARTICIPANTS_UPDATE");
                participantsUpdate.put("participants", session.getParticipants());

                messagingTemplate.convertAndSend(
                        "/topic/voice/" + request.getChannelId(),
                        participantsUpdate);
            }
        } catch (Exception e) {
            log.error("Error toggling screen share: {}", e.getMessage(), e);
        }
    }

    /**
     * Speaking state updates (voice activity)
     * Client sends to: /app/voice.speaking
     */
    @MessageMapping("/voice.speaking")
    public void updateSpeaking(@Payload VoiceSpeakingRequest request, Principal principal) {
        try {
            String username = principal.getName();
            User user = userService.getUserByUsername(username);

            Optional<VoiceSession> sessionOpt = voiceSessionService.findActiveSession(request.getChannelId());

            if (sessionOpt.isPresent()) {
                VoiceSession session = sessionOpt.get();

                final Map<String, Object> speakingEvent = new HashMap<>();
                speakingEvent.put("type", "USER_SPEAKING");
                speakingEvent.put("userId", user.getId());
                speakingEvent.put("isSpeaking", Boolean.TRUE.equals(request.getIsSpeaking()));

                session.getParticipants().stream()
                        .filter(p -> p.getUserId().equals(user.getId()))
                        .findFirst()
                        .ifPresent(p -> {
                            boolean isSpeaking = Boolean.TRUE.equals(request.getIsSpeaking());
                            if (Boolean.TRUE.equals(p.getIsMuted())) {
                                isSpeaking = false;
                            }
                            p.setIsSpeaking(isSpeaking);
                            speakingEvent.put("peerId", p.getConnectionId());
                        });

                voiceSessionService.save(session);

                messagingTemplate.convertAndSend(
                        "/topic/voice/" + request.getChannelId(),
                        speakingEvent);
            }
        } catch (Exception e) {
            log.debug("Error updating speaking: {}", e.getMessage(), e);
        }
    }
}
