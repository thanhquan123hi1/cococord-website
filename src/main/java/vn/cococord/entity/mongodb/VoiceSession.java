package vn.cococord.entity.mongodb;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "voice_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoiceSession {

    @Id
    private String id;

    @Indexed
    private Long channelId; // Voice Channel ID

    @Indexed
    private Long serverId;

    @Builder.Default
    private List<VoiceParticipant> participants = new ArrayList<>();

    @Builder.Default
    private LocalDateTime startedAt = LocalDateTime.now();

    private LocalDateTime endedAt;

    @Builder.Default
    private Boolean isActive = true;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VoiceParticipant {
        private Long userId;
        private String username;
        private String displayName;
        private String avatarUrl;
        @Builder.Default
        private Boolean isMuted = false;
        @Builder.Default
        private Boolean isDeafened = false;
        @Builder.Default
        private Boolean isSpeaking = false;
        @Builder.Default
        private LocalDateTime joinedAt = LocalDateTime.now();
        private LocalDateTime leftAt;
        private String connectionId; // WebRTC connection ID
    }
}
