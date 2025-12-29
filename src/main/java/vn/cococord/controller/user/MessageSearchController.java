package vn.cococord.controller.user;

import java.util.HashMap;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.request.MessageSearchRequest;
import vn.cococord.dto.response.MessageSearchResponse;
import vn.cococord.service.IMessageSearchService;

/**
 * REST Controller for message search functionality
 * Uses MongoDB Text Index for full-text search
 */
@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Slf4j
public class MessageSearchController {

    private final IMessageSearchService messageSearchService;

    /**
     * Search messages across channels/servers
     * GET /api/messages/search?keyword=xxx&channelId=xxx&serverId=xxx&page=0&size=20
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchMessages(
            @RequestParam String keyword,
            @RequestParam(required = false) Long channelId,
            @RequestParam(required = false) Long serverId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String messageType,
            @RequestParam(required = false) Boolean hasAttachments,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Message search request: keyword='{}', channelId={}, serverId={}, user={}", 
                keyword, channelId, serverId, userDetails.getUsername());

        MessageSearchRequest request = MessageSearchRequest.builder()
                .keyword(keyword)
                .channelId(channelId)
                .serverId(serverId)
                .userId(userId)
                .messageType(messageType)
                .hasAttachments(hasAttachments)
                .page(page)
                .size(size)
                .build();

        Page<MessageSearchResponse> results = messageSearchService.searchMessages(request, userDetails.getUsername());

        Map<String, Object> response = new HashMap<>();
        response.put("content", results.getContent());
        response.put("totalElements", results.getTotalElements());
        response.put("totalPages", results.getTotalPages());
        response.put("currentPage", results.getNumber());
        response.put("size", results.getSize());
        response.put("hasNext", results.hasNext());
        response.put("hasPrevious", results.hasPrevious());

        return ResponseEntity.ok(response);
    }

    /**
     * Search messages in a specific channel
     * GET /api/messages/search/channel/{channelId}?keyword=xxx
     */
    @GetMapping("/search/channel/{channelId}")
    public ResponseEntity<Map<String, Object>> searchInChannel(
            @PathVariable Long channelId,
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Channel message search: channelId={}, keyword='{}', user={}", 
                channelId, keyword, userDetails.getUsername());

        Page<MessageSearchResponse> results = messageSearchService.searchInChannel(
                channelId, keyword, page, size, userDetails.getUsername());

        Map<String, Object> response = new HashMap<>();
        response.put("content", results.getContent());
        response.put("totalElements", results.getTotalElements());
        response.put("totalPages", results.getTotalPages());
        response.put("currentPage", results.getNumber());
        response.put("size", results.getSize());

        return ResponseEntity.ok(response);
    }

    /**
     * Search messages in all channels of a server
     * GET /api/messages/search/server/{serverId}?keyword=xxx
     */
    @GetMapping("/search/server/{serverId}")
    public ResponseEntity<Map<String, Object>> searchInServer(
            @PathVariable Long serverId,
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Server message search: serverId={}, keyword='{}', user={}", 
                serverId, keyword, userDetails.getUsername());

        Page<MessageSearchResponse> results = messageSearchService.searchInServer(
                serverId, keyword, page, size, userDetails.getUsername());

        Map<String, Object> response = new HashMap<>();
        response.put("content", results.getContent());
        response.put("totalElements", results.getTotalElements());
        response.put("totalPages", results.getTotalPages());
        response.put("currentPage", results.getNumber());
        response.put("size", results.getSize());

        return ResponseEntity.ok(response);
    }
}
