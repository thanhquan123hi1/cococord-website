package vn.cococord.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendDirectMessageRequest {

    @NotBlank(message = "Message content cannot be empty")
    private String content;

    private List<String> attachmentUrls;
}
