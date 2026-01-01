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
import vn.cococord.repository.IUserRepository;

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
    private final IUserRepository userRepository;

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
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> event = new HashMap<>();
            event.put("type", request.getType());
            event.put("roomId", request.getRoomId());
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
        } catch (Exception e) {
            log.error("Error in call signaling: {}", e.getMessage(), e);
        }
    }
}
