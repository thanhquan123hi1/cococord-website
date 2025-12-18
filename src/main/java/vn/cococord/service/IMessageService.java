package vn.cococord.service;

import java.util.List;

import org.springframework.data.domain.Page;

import vn.cococord.dto.request.EditMessageRequest;
import vn.cococord.dto.request.SendMessageRequest;
import vn.cococord.dto.response.ChatMessageResponse;
import vn.cococord.entity.mongodb.Message;

public interface IMessageService {

    ChatMessageResponse sendMessage(SendMessageRequest request, String username);

    ChatMessageResponse editMessage(EditMessageRequest request, String username);

    void deleteMessage(String messageId, String username);

    ChatMessageResponse getMessageById(String messageId);

    Page<ChatMessageResponse> getChannelMessages(Long channelId, int page, int size);

    List<ChatMessageResponse> getMessageReplies(String parentMessageId);

    /**
     * Add reaction to a message
     */
    void addReaction(String messageId, String emoji, String username);

    /**
     * Remove reaction from a message
     */
    void removeReaction(String messageId, String emoji, String username);

    /**
     * Pin a message
     */
    void pinMessage(String messageId, String username);

    /**
     * Unpin a message
     */
    void unpinMessage(String messageId, String username);

    Message convertToEntity(SendMessageRequest request, Long userId, String username, String displayName,
            String avatarUrl);

    ChatMessageResponse convertToResponse(Message message);
}
