package vn.cococord.dto;

import lombok.Data;

@Data
public class NotificationDto {
    private Long id;
    private String type;
    private String message;
    private String fromUsername;
    private Long serverId;
    private String serverName;
    private Long channelId;
    private String channelName;
    private Long conversationId;
    private boolean read;
    private String createdAt;
}
