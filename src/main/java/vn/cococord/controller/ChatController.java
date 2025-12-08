package vn.cococord.controller;

import vn.cococord.document.ChatMessage;
import vn.cococord.dto.MessageDto;
import vn.cococord.entity.User;
import vn.cococord.service.ChatService;
import vn.cococord.service.UserService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.security.Principal;

@Controller
public class ChatController {
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;
    private final UserService userService;
    public ChatController(SimpMessagingTemplate messagingTemplate, ChatService chatService, UserService userService) {
        this.messagingTemplate = messagingTemplate;
        this.chatService = chatService;
        this.userService = userService;
    }
    @MessageMapping("/server/{serverId}/channel/{channelId}")
    public void sendChannelMessage(@DestinationVariable Long serverId, @DestinationVariable Long channelId, MessageDto messageDto, Principal principal) {
        User user = userService.findByUsername(principal.getName()).orElseThrow();
        ChatMessage message = new ChatMessage();
        message.setChannelId(channelId);
        message.setAuthorId(user.getId());
        message.setContent(messageDto.getContent());
        ChatMessage saved = chatService.save(message);
        MessageDto response = new MessageDto(saved.getId(), saved.getChannelId(), saved.getConversationId(), saved.getAuthorId(), saved.getContent(), saved.getCreatedAt());
        messagingTemplate.convertAndSend("/topic/server/" + serverId + "/channel/" + channelId, response);
    }

    @MessageMapping("/conversation/{conversationId}")
    public void sendConversationMessage(@DestinationVariable Long conversationId, MessageDto messageDto, Principal principal) {
        User user = userService.findByUsername(principal.getName()).orElseThrow();
        ChatMessage message = new ChatMessage();
        message.setConversationId(conversationId);
        message.setAuthorId(user.getId());
        message.setContent(messageDto.getContent());
        ChatMessage saved = chatService.save(message);
        MessageDto response = new MessageDto(saved.getId(), saved.getChannelId(), saved.getConversationId(), saved.getAuthorId(), saved.getContent(), saved.getCreatedAt());
        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, response);
    }
}
