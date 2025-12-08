package vn.cococord.document;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import java.util.List;

@Document(collection = "messages")
@Data
public class ChatMessage {
    @Id
    private String id;
    private Long channelId;
    private Long conversationId;
    private Long authorId;
    private String content;
    private List<Attachment> attachments;
    private Date createdAt = new Date();
    private Date editedAt;
    private Date deletedAt;
    private Long deletedBy;
    @Data
    public static class Attachment {
        private String id;
        private String url;
        private String type;
        private String fileName;
        private long fileSize;
    }
}
