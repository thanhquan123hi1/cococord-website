package vn.cococord.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * WebRTC signaling payload for 1:1 calls.
 *
 * Client sends to: /app/call.signal
 * Server broadcasts to: /topic/call/{roomId}
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallSignalRequest {

    /**
     * Room identifier (we use dmGroupId for 1:1 DM calls).
     */
    private String roomId;

    /**
     * Message type: CALL_START, OFFER, ANSWER, ICE, HANGUP
     */
    private String type;

    /**
     * SDP offer/answer.
     */
    private String sdp;

    /**
     * ICE candidate string.
     */
    private String candidate;

    private String sdpMid;

    private Integer sdpMLineIndex;

    /**
     * Whether this call intends video.
     */
    private Boolean video;
}
