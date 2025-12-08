package vn.cococord.controller;

import vn.cococord.dto.ConversationDto;
import vn.cococord.entity.Conversation;
import vn.cococord.entity.User;
import vn.cococord.service.ConversationService;
import vn.cococord.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {
    private final ConversationService conversationService;
    private final UserService userService;
    public ConversationController(ConversationService conversationService, UserService userService) {
        this.conversationService = conversationService;
        this.userService = userService;
    }
    @GetMapping
    public ResponseEntity<List<ConversationDto>> listConversations(Principal principal) {
        User user = userService.findByUsername(principal.getName()).orElseThrow();
        List<Conversation> conversations = conversationService.listConversations(user);
        List<ConversationDto> dtos = conversations.stream().map(conversationService::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    @PostMapping
    public ResponseEntity<ConversationDto> createConversation(@RequestBody Map<String, Object> body, Principal principal) {
        User user = userService.findByUsername(principal.getName()).orElseThrow();
        @SuppressWarnings("unchecked")
        List<String> usernames = (List<String>) body.get("participants");
        String name = (String) body.getOrDefault("name", null);
        Conversation conversation = conversationService.createConversation(user, usernames, name);
        return ResponseEntity.ok(conversationService.toDto(conversation));
    }
}