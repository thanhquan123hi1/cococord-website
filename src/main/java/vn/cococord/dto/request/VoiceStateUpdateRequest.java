package vn.cococord.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoiceStateUpdateRequest {
    private Long channelId;
    private Boolean micOn;
    private Boolean camOn;
    private Boolean screenOn;
    private Boolean speaking;
}
