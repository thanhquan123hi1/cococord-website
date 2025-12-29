package vn.cococord.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoiceJoinRequest {
    private Long channelId;
    private Long serverId;
    private String peerId;
}
