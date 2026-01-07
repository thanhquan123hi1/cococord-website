package vn.cococord.controller.user;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.cococord.annotation.CheckChannelAccess;
import vn.cococord.dto.response.ChatMessageResponse;
import vn.cococord.service.IMessageService;

import java.util.List;

/**
 * REST API Controller for message history
 * Used to fetch old messages, not for sending (use WebSocket for that)
 */
@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageRestController {

    private final IMessageService messageService;

    /**
     * GET /api/messages/channel/{channelId}
     * Get message history for a channel (paginated)
     * Requires VIEW_CHANNEL permission
     */
    @GetMapping("/channel/{channelId}")
    @CheckChannelAccess(permission = "VIEW_CHANNEL", channelIdParam = "channelId")
    public ResponseEntity<Page<ChatMessageResponse>> getChannelMessages(
            @PathVariable Long channelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        Page<ChatMessageResponse> messages = messageService.getChannelMessages(channelId, page, size);
        return ResponseEntity.ok(messages);
    }

    /**
     * GET /api/messages/{messageId}
     * Get a specific message by ID
     */
    @GetMapping("/{messageId}")
    public ResponseEntity<ChatMessageResponse> getMessage(
            @PathVariable String messageId,
            @AuthenticationPrincipal UserDetails userDetails) {

        ChatMessageResponse message = messageService.getMessageById(messageId);
        return ResponseEntity.ok(message);
    }

    /**
     * GET /api/messages/{messageId}/replies
     * Get all replies to a message
     */
    @GetMapping("/{messageId}/replies")
    public ResponseEntity<List<ChatMessageResponse>> getMessageReplies(
            @PathVariable String messageId,
            @AuthenticationPrincipal UserDetails userDetails) {

        List<ChatMessageResponse> replies = messageService.getMessageReplies(messageId);
        return ResponseEntity.ok(replies);
    }

    /**
     * DELETE /api/messages/{messageId}
     * Delete a message
     */
    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable String messageId,
            @AuthenticationPrincipal UserDetails userDetails) {

        messageService.deleteMessage(messageId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }
}
