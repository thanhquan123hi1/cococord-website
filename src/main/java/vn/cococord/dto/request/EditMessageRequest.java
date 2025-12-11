package vn.cococord.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EditMessageRequest {

    @NotBlank(message = "Message ID is required")
    private String messageId;

    @NotBlank(message = "Content cannot be empty")
    private String content;
}
