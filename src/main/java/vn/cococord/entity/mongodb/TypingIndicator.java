package vn.cococord.entity.mongodb;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "typing_indicators")
@CompoundIndex(def = "{'channelId': 1, 'userId': 1}", unique = true)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TypingIndicator {

    @Id
    private String id;

    @Indexed
    private Long channelId; // Channel ID or DM Group ID

    @Indexed
    private Long userId;

    private String username;

    private String displayName;

    private TypingContext context; // SERVER or DM

    @Builder.Default
    private LocalDateTime startedAt = LocalDateTime.now();

    // Auto-expire after 5 seconds (handled by MongoDB TTL index)
    // Note: Configure TTL index in MongoDB configuration or repository
    @Indexed
    @Builder.Default
    private LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(5);

    public enum TypingContext {
        SERVER, DM
    }
}
