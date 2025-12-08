package vn.cococord.dto;

import lombok.Data;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Data
public class ChatMessageDto {
    private String id;
    private Long channelId;
    private Long conversationId;
    private Long authorId;
    private String senderUsername;
    private String senderAvatar;
    private String content;
    private List<AttachmentDto> attachments;
    private String replyToId;
    private ChatMessageDto replyTo;
    private List<ReactionDto> reactions;
    private Date createdAt;
    private Date editedAt;
    private boolean edited;
    private boolean deleted;

    @Data
    public static class AttachmentDto {
        private String id;
        private String url;
        private String type;
        private String fileName;
        private long fileSize;
    }

    @Data
    public static class ReactionDto {
        private String emoji;
        private int count;
        private List<String> usernames;
        private boolean userReacted;
    }
}
