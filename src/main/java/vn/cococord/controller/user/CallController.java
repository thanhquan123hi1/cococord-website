package vn.cococord.controller.user;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.request.CallSignalRequest;
import vn.cococord.entity.mysql.User;
import vn.cococord.service.IDirectMessageService;
import vn.cococord.service.IUserService;

/**
 * WebSocket signaling controller for 1:1 voice/video calls.
 *
 * Signaling is sent over STOMP WebSocket and media is transmitted P2P using
 * WebRTC.
 */
@Controller
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class CallController {

    private final SimpMessagingTemplate messagingTemplate;
    private final IUserService userService;
    private final IDirectMessageService directMessageService;

    /**
     * Client sends to: /app/call.signal
     * Server broadcasts to: /topic/call/{roomId}
     */
    @MessageMapping("/call.signal")
    public void signal(@Payload CallSignalRequest request, Principal principal) {
        if (request == null || request.getRoomId() == null || request.getRoomId().isBlank()) {
            return;
        }

        try {
            String username = principal.getName();
            User user = userService.getUserByUsername(username);

            Map<String, Object> event = new HashMap<>();
            event.put("type", request.getType());
            event.put("roomId", request.getRoomId());
            if (request.getCallId() != null && !request.getCallId().isBlank()) {
                event.put("callId", request.getCallId());
            }
            event.put("fromUserId", user.getId());
            event.put("fromUsername", user.getUsername());

            if (request.getVideo() != null)
                event.put("video", request.getVideo());
            if (request.getSdp() != null)
                event.put("sdp", request.getSdp());
            if (request.getCandidate() != null)
                event.put("candidate", request.getCandidate());
            if (request.getSdpMid() != null)
                event.put("sdpMid", request.getSdpMid());
            if (request.getSdpMLineIndex() != null)
                event.put("sdpMLineIndex", request.getSdpMLineIndex());

            messagingTemplate.convertAndSend("/topic/call/" + request.getRoomId(), event);

            // For CALL_START, also send to target user's personal topic so they receive
            // the incoming call even if they haven't opened the DM chat yet.
            if ("CALL_START".equals(request.getType())) {
                // Preferred: client provides targetUserId.
                if (request.getTargetUserId() != null) {
                    log.info("[CALL] CALL_START roomId={} fromUserId={} targetUserId={} (client)",
                            request.getRoomId(), user.getId(), request.getTargetUserId());
                    messagingTemplate.convertAndSend(
                            "/topic/user." + request.getTargetUserId() + ".calls",
                            event);
                } else {
                    // Fallback: derive recipients from DM group membership.
                    // This makes incoming call notification reliable even if frontend payload
                    // cannot resolve targetUserId.
                    try {
                        Long dmGroupId = Long.valueOf(request.getRoomId());
                        var recipients = directMessageService.findOtherUserIds(dmGroupId, user.getId());
                        log.info("[CALL] CALL_START roomId={} fromUserId={} recipients={} (derived)",
                                request.getRoomId(), user.getId(), recipients);
                        for (Long recipientId : recipients) {
                            if (recipientId == null) {
                                continue;
                            }
                            messagingTemplate.convertAndSend(
                                    "/topic/user." + recipientId + ".calls",
                                    event);
                        }
                    } catch (Exception ignored) {
                        // ignore: roomId may not be numeric or DM membership lookup failed
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error in call signaling: {}", e.getMessage(), e);
        }
    }
}
