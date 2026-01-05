package vn.cococord.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendMessageRequest {

    @NotNull(message = "Channel ID is required")
    private Long channelId;

    private String content; // Optional if attachments are present

    private String parentMessageId; // For replies

    private String threadId; // For thread messages

    private List<AttachmentRequest> attachments; // File attachments
}
