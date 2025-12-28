package vn.cococord.config;

import java.util.List;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.websocket.PresenceChangeEvent;
import vn.cococord.dto.websocket.WebSocketEvent;
import vn.cococord.entity.mysql.Server;
import vn.cococord.entity.mysql.ServerMember;
import vn.cococord.repository.IServerMemberRepository;
import vn.cococord.repository.IUserRepository;
import vn.cococord.service.IFriendService;

/**
 * Redis Pub/Sub subscriber for presence events.
 * Receives presence changes from other server instances and broadcasts via WebSocket.
 * 
 * Only active when Redis is enabled (spring.data.redis.enabled=true)
 */
@Component
@ConditionalOnProperty(name = "spring.data.redis.enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
@Slf4j
public class PresenceRedisMessageSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final IUserRepository userRepository;
    private final IServerMemberRepository serverMemberRepository;
    private final IFriendService friendService;
    private final ObjectMapper objectMapper;

    @Override
    public void onMessage(@NonNull Message message, @Nullable byte[] pattern) {
        try {
            String body = new String(message.getBody());
            PresenceChangeEvent event = objectMapper.readValue(body, PresenceChangeEvent.class);
            
            log.debug("Received presence event from Redis: userId={}, status={}", 
                    event.getUserId(), event.getNewStatus());
            
            // Broadcast to WebSocket clients
            broadcastPresenceChange(event);
            
        } catch (Exception e) {
            log.error("Failed to process presence message from Redis: {}", e.getMessage(), e);
        }
    }

    private void broadcastPresenceChange(PresenceChangeEvent event) {
        WebSocketEvent wsEvent = new WebSocketEvent("user.status.changed", event);

        // Broadcast to user's friends
        try {
            userRepository.findById(event.getUserId()).ifPresent(user -> {
                try {
                    var friends = friendService.getFriends(user.getUsername());
                    for (var friend : friends) {
                        messagingTemplate.convertAndSendToUser(
                            String.valueOf(friend.getId()),
                            "/queue/presence",
                            wsEvent
                        );
                    }
                } catch (Exception e) {
                    log.error("Failed to broadcast presence to friends: {}", e.getMessage());
                }
            });
        } catch (Exception e) {
            log.error("Failed to find user for presence broadcast: {}", e.getMessage());
        }

        // Broadcast to servers where user is a member
        try {
            List<ServerMember> memberships = serverMemberRepository.findByUserId(event.getUserId());
            for (ServerMember membership : memberships) {
                Server server = membership.getServer();
                messagingTemplate.convertAndSend(
                    "/topic/server." + server.getId() + ".presence",
                    wsEvent
                );
            }
        } catch (Exception e) {
            log.error("Failed to broadcast presence to servers: {}", e.getMessage());
        }

        // Also broadcast to global presence topic
        messagingTemplate.convertAndSend("/topic/presence", wsEvent);
    }
}
