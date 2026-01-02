package vn.cococord.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoiceSignalOfferRequest {
    private Long channelId;
    private Long fromUserId;
    private Long toUserId;
    private String sdp;
}
