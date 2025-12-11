package vn.cococord.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateChannelRequest {

    @NotBlank(message = "Channel name is required")
    @Size(min = 2, max = 100, message = "Channel name must be between 2 and 100 characters")
    private String name;

    @NotNull(message = "Channel type is required")
    private String type; // TEXT, VOICE, ANNOUNCEMENT, STAGE

    private Long categoryId;

    @Size(max = 1000, message = "Topic cannot exceed 1000 characters")
    private String topic;

    @Builder.Default
    private Integer position = 0;

    @Builder.Default
    private Boolean isPrivate = false;

    @Builder.Default
    private Boolean isNsfw = false;

    @Builder.Default
    private Integer slowMode = 0;
}
