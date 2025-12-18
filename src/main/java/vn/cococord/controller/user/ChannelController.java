package vn.cococord.controller.user;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.request.CreateChannelRequest;
import vn.cococord.dto.request.UpdateChannelRequest;
import vn.cococord.dto.response.ChannelResponse;
import vn.cococord.service.IChannelService;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class ChannelController {

    private final IChannelService channelService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Get all channels in a server
     */
    @GetMapping("/servers/{serverId}/channels")
    public ResponseEntity<List<ChannelResponse>> getServerChannels(
            @PathVariable Long serverId,
            Authentication authentication) {
        String username = authentication.getName();
        List<ChannelResponse> channels = channelService.getServerChannels(serverId, username);
        return ResponseEntity.ok(channels);
    }

    /**
     * Get a specific channel by ID
     */
    @GetMapping("/channels/{channelId}")
    public ResponseEntity<ChannelResponse> getChannelById(
            @PathVariable Long channelId,
            Authentication authentication) {
        String username = authentication.getName();
        ChannelResponse channel = channelService.getChannelById(channelId, username);
        return ResponseEntity.ok(channel);
    }

    /**
     * Create a new channel in a server
     */
    @PostMapping("/servers/{serverId}/channels")
    public ResponseEntity<ChannelResponse> createChannel(
            @PathVariable Long serverId,
            @Valid @RequestBody CreateChannelRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        ChannelResponse channel = channelService.createChannel(serverId, request, username);
        
        // Broadcast channel created event via WebSocket
        broadcastChannelEvent(serverId, "channel.created", channel);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(channel);
    }

    /**
     * Update a channel
     */
    @PutMapping("/channels/{channelId}")
    public ResponseEntity<ChannelResponse> updateChannel(
            @PathVariable Long channelId,
            @Valid @RequestBody UpdateChannelRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        ChannelResponse channel = channelService.updateChannel(channelId, request, username);
        
        // Broadcast channel updated event via WebSocket
        broadcastChannelEvent(channel.getServerId(), "channel.updated", channel);
        
        return ResponseEntity.ok(channel);
    }

    /**
     * Delete a channel
     */
    @DeleteMapping("/channels/{channelId}")
    public ResponseEntity<Void> deleteChannel(
            @PathVariable Long channelId,
            Authentication authentication) {
        String username = authentication.getName();
        
        // Get channel info before deletion for broadcasting
        ChannelResponse channel = channelService.getChannelById(channelId, username);
        Long serverId = channel.getServerId();
        
        channelService.deleteChannel(channelId, username);
        
        // Broadcast channel deleted event via WebSocket
        broadcastChannelEvent(serverId, "channel.deleted", Map.of(
            "channelId", channelId,
            "serverId", serverId
        ));
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Update channel position
     */
    @PatchMapping("/channels/{channelId}/position")
    public ResponseEntity<ChannelResponse> updateChannelPosition(
            @PathVariable Long channelId,
            @RequestBody Map<String, Integer> request,
            Authentication authentication) {
        String username = authentication.getName();
        Integer position = request.get("position");
        
        if (position == null) {
            return ResponseEntity.badRequest().build();
        }
        
        ChannelResponse channel = channelService.updateChannelPosition(channelId, position, username);
        
        // Broadcast channel updated event
        broadcastChannelEvent(channel.getServerId(), "channel.updated", channel);
        
        return ResponseEntity.ok(channel);
    }

    /**
     * Broadcast channel events to all server members via WebSocket
     */
    private void broadcastChannelEvent(Long serverId, String eventType, Object payload) {
        try {
            Map<String, Object> event = Map.of(
                "type", eventType,
                "payload", payload
            );
            messagingTemplate.convertAndSend("/topic/server/" + serverId + "/channels", event);
            log.debug("Broadcasted {} event for server {}", eventType, serverId);
        } catch (Exception e) {
            log.error("Failed to broadcast channel event: {}", e.getMessage());
        }
    }
}
