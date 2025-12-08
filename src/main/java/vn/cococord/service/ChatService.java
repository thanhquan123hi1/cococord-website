package vn.cococord.service;

import vn.cococord.document.ChatMessage;
import vn.cococord.repository.ChatMessageRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ChatService {
    private final ChatMessageRepository chatMessageRepository;
    public ChatService(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
    }
    public ChatMessage save(ChatMessage message) {
        return chatMessageRepository.save(message);
    }
    public List<ChatMessage> loadMessagesByChannel(Long channelId, int page, int size) {
        return chatMessageRepository.findByChannelIdOrderByCreatedAtDesc(channelId, PageRequest.of(page, size));
    }
    public List<ChatMessage> loadMessagesByConversation(Long conversationId, int page, int size) {
        return chatMessageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, PageRequest.of(page, size));
    }
}
