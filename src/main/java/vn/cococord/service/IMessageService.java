package vn.cococord.service;

import org.springframework.data.domain.Page;
import vn.cococord.dto.request.EditMessageRequest;
import vn.cococord.dto.request.SendMessageRequest;
import vn.cococord.dto.response.ChatMessageResponse;
import vn.cococord.entity.mongodb.Message;

import java.util.List;

public interface IMessageService {

    ChatMessageResponse sendMessage(SendMessageRequest request, String username);

    ChatMessageResponse editMessage(EditMessageRequest request, String username);

    void deleteMessage(String messageId, String username);

    ChatMessageResponse getMessageById(String messageId);

    Page<ChatMessageResponse> getChannelMessages(Long channelId, int page, int size);

    List<ChatMessageResponse> getMessageReplies(String parentMessageId);

    Message convertToEntity(SendMessageRequest request, Long userId, String username, String displayName,
            String avatarUrl);

    ChatMessageResponse convertToResponse(Message message);
}
