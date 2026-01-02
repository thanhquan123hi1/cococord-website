package vn.cococord.dto.request;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoiceSignalIceRequest {
    private Long channelId;
    private Long fromUserId;
    private Long toUserId;
    private Map<String, Object> candidate;
}
