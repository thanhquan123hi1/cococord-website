package vn.cococord.entity.mongodb;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "read_receipts")
@CompoundIndex(def = "{'channelId': 1, 'userId': 1}", unique = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReadReceipt {

    @Id
    private String id;

    @Indexed
    private Long channelId; // Channel ID or DM Group ID

    @Indexed
    private Long userId;

    private String lastReadMessageId; // MongoDB Message ID

    private LocalDateTime lastReadAt = LocalDateTime.now();

    private Integer unreadCount = 0;

    // Mention tracking
    private Integer unreadMentions = 0;

    private LocalDateTime updatedAt = LocalDateTime.now();
}
