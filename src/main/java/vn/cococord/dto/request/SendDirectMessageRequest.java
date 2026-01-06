package vn.cococord.dto.request;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendDirectMessageRequest {

    private String content;

    private List<String> attachmentUrls;

    /**
     * Message type: TEXT, IMAGE, FILE, STICKER, GIF, AUDIO, VIDEO
     * Default is TEXT if not specified
     */
    private String type;

    /**
     * JSON string containing additional metadata for sticker/gif
     * Example for sticker: {"stickerId": "123", "packId": "456"}
     * Example for GIF: {"gifId": "abc", "source": "tenor"}
     */
    private String metadata;
}
