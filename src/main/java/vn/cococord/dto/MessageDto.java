package vn.cococord.dto;

import java.util.Date;

public class MessageDto {
    private String id;
    private Long channelId;
    private Long conversationId;
    private Long authorId;
    private String content;
    private Date createdAt;
    public MessageDto() {
    }
    public MessageDto(String id, Long channelId, Long conversationId, Long authorId, String content, Date createdAt) {
        this.id = id;
        this.channelId = channelId;
        this.conversationId = conversationId;
        this.authorId = authorId;
        this.content = content;
        this.createdAt = createdAt;
    }
    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }
    public Long getChannelId() {
        return channelId;
    }
    public void setChannelId(Long channelId) {
        this.channelId = channelId;
    }
    public Long getConversationId() {
        return conversationId;
    }
    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }
    public Long getAuthorId() {
        return authorId;
    }
    public void setAuthorId(Long authorId) {
        this.authorId = authorId;
    }
    public String getContent() {
        return content;
    }
    public void setContent(String content) {
        this.content = content;
    }
    public Date getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
}
