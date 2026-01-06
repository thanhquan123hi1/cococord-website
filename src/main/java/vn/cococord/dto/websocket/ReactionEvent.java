package vn.cococord.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReactionEvent {
    private String messageId;
    private String emoji;
    private Long userId;
    private String username;
    private String action; // "ADD" or "REMOVE"
    private Integer count; // New count for this emoji
}
