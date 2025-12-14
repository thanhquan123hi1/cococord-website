package vn.cococord.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DirectMessageSidebarItemResponse {
    private Long dmGroupId;
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private long unreadCount;
}
