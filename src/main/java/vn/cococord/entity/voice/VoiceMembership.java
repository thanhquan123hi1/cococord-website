package vn.cococord.entity.voice;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoiceMembership {
    private long channelId;
    private long userId;
}
