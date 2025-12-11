package vn.cococord.dto.request;

import jakarta.validation.constraints.NotBlank;
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

    @NotBlank(message = "Content cannot be empty")
    private String content;

    private String parentMessageId; // For replies

    private String threadId; // For thread messages
}
