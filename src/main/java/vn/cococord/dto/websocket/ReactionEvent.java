package vn.cococord.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReactionEvent {
    private String messageId;
    private String emoji;
    private Long userId;
    private String username;
}
