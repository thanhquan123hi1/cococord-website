package vn.cococord.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelResponse {
    private Long id;
    private Long serverId;
    private Long categoryId;
    private String categoryName;
    private String name;
    private String type;
    private String topic;
    private Integer position;
    private Boolean isPrivate;
    private Boolean isNsfw;
    private Boolean isDefault;
    private Integer slowMode;
    private Integer bitrate;
    private Integer userLimit;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
