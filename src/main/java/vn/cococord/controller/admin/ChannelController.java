package vn.cococord.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.cococord.dto.request.CreateChannelRequest;
import vn.cococord.dto.request.UpdateChannelRequest;
import vn.cococord.dto.response.ChannelResponse;
import vn.cococord.dto.response.MessageResponse;

import java.util.List;

/**
 * REST Controller for Channel Management
 * Handles CRUD operations for text/voice channels
 */
@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
public class ChannelController {

    private final vn.cococord.service.IChannelService channelService;

    /**
     * GET /api/channels/{channelId}
     * Get channel by ID
     */
    @GetMapping("/{channelId}")
    public ResponseEntity<ChannelResponse> getChannel(
            @PathVariable Long channelId,
            @AuthenticationPrincipal UserDetails userDetails) {
        ChannelResponse channel = channelService.getChannelById(channelId, userDetails.getUsername());
        return ResponseEntity.ok(channel);
    }

    /**
     * POST /api/servers/{serverId}/channels
     * Create new channel in server
     */
    @PostMapping("/servers/{serverId}/channels")
    public ResponseEntity<ChannelResponse> createChannel(
            @PathVariable Long serverId,
            @Valid @RequestBody CreateChannelRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ChannelResponse channel = channelService.createChannel(serverId, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(channel);
    }

    /**
     * PUT /api/channels/{channelId}
     * Update channel (Admin/Moderator)
     */
    @PutMapping("/{channelId}")
    public ResponseEntity<ChannelResponse> updateChannel(
            @PathVariable Long channelId,
            @Valid @RequestBody UpdateChannelRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ChannelResponse channel = channelService.updateChannel(channelId, request, userDetails.getUsername());
        return ResponseEntity.ok(channel);
    }

    /**
     * DELETE /api/channels/{channelId}
     * Delete channel (Admin/Moderator)
     */
    @DeleteMapping("/{channelId}")
    public ResponseEntity<MessageResponse> deleteChannel(
            @PathVariable Long channelId,
            @AuthenticationPrincipal UserDetails userDetails) {
        channelService.deleteChannel(channelId, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Channel deleted successfully"));
    }

    /**
     * GET /api/servers/{serverId}/channels
     * Get all channels in server
     */
    @GetMapping("/servers/{serverId}/channels")
    public ResponseEntity<List<ChannelResponse>> getServerChannels(
            @PathVariable Long serverId,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ChannelResponse> channels = channelService.getServerChannels(serverId, userDetails.getUsername());
        return ResponseEntity.ok(channels);
    }

    /**
     * PUT /api/channels/{channelId}/position
     * Reorder channel position
     */
    @PutMapping("/{channelId}/position")
    public ResponseEntity<ChannelResponse> updateChannelPosition(
            @PathVariable Long channelId,
            @RequestParam Integer position,
            @AuthenticationPrincipal UserDetails userDetails) {
        ChannelResponse channel = channelService.updateChannelPosition(channelId, position, userDetails.getUsername());
        return ResponseEntity.ok(channel);
    }

    /**
     * PUT /api/channels/{channelId}/category
     * Move channel to different category
     */
    @PutMapping("/{channelId}/category")
    public ResponseEntity<ChannelResponse> moveChannelToCategory(
            @PathVariable Long channelId,
            @RequestParam(required = false) Long categoryId,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement channelService.moveToCategory(channelId, categoryId,
        // userDetails.getUsername())
        return ResponseEntity.ok(ChannelResponse.builder().build());
    }
}
