package vn.cococord.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendRequestResponse {
    private Long id;
    private Long senderId;
    private String senderUsername;
    private String senderDisplayName;
    private String senderAvatarUrl;
    private Long receiverId;
    private String receiverUsername;
    private String receiverDisplayName;
    private String receiverAvatarUrl;
    private String status; // PENDING, ACCEPTED, DECLINED
    private LocalDateTime createdAt;
}
