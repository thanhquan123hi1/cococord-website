package vn.cococord.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateChannelRequest {

    @Size(min = 2, max = 100, message = "Channel name must be between 2 and 100 characters")
    private String name;

    private String type; // TEXT, VOICE, ANNOUNCEMENT, STAGE

    private Long categoryId;

    @Size(max = 1000, message = "Topic cannot exceed 1000 characters")
    private String topic;

    private Integer position;

    private Boolean isPrivate;

    private Boolean isNsfw;

    private Integer slowMode;
}
