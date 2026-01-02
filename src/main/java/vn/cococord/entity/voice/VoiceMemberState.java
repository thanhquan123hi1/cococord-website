package vn.cococord.entity.voice;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoiceMemberState {
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    @Builder.Default
    private boolean micOn = true;
    @Builder.Default
    private boolean camOn = false;
    @Builder.Default
    private boolean screenOn = false;
    @Builder.Default
    private boolean speaking = false;
    @Builder.Default
    private LocalDateTime joinedAt = LocalDateTime.now();
}
