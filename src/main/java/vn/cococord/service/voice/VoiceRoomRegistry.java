package vn.cococord.service.voice;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Component
public class VoiceRoomRegistry {

    private final ConcurrentHashMap<Long, ConcurrentHashMap<Long, VoiceMemberState>> rooms = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Membership> membershipBySessionId = new ConcurrentHashMap<>();

    public List<VoiceMemberState> join(long channelId, VoiceMemberState member, String sessionId) {
        rooms.computeIfAbsent(channelId, __ -> new ConcurrentHashMap<>())
                .put(member.getUserId(), member);

        if (sessionId != null) {
            membershipBySessionId.put(sessionId, new Membership(channelId, member.getUserId()));
        }

        return snapshot(channelId);
    }

    public List<VoiceMemberState> leave(long channelId, long userId) {
        ConcurrentHashMap<Long, VoiceMemberState> room = rooms.get(channelId);
        if (room == null) return Collections.emptyList();

        room.remove(userId);
        if (room.isEmpty()) {
            rooms.remove(channelId);
        }

        return snapshot(channelId);
    }

    public Optional<Membership> removeBySessionId(String sessionId) {
        if (sessionId == null) return Optional.empty();
        Membership membership = membershipBySessionId.remove(sessionId);
        if (membership == null) return Optional.empty();

        leave(membership.getChannelId(), membership.getUserId());
        return Optional.of(membership);
    }

    public Optional<VoiceMemberState> getMember(long channelId, long userId) {
        Map<Long, VoiceMemberState> room = rooms.get(channelId);
        if (room == null) return Optional.empty();
        return Optional.ofNullable(room.get(userId));
    }

    public List<VoiceMemberState> snapshot(long channelId) {
        Map<Long, VoiceMemberState> room = rooms.get(channelId);
        if (room == null || room.isEmpty()) return Collections.emptyList();
        return new ArrayList<>(room.values());
    }

    public void updateState(long channelId, long userId, Boolean micOn, Boolean camOn, Boolean screenOn, Boolean speaking) {
        getMember(channelId, userId).ifPresent(member -> {
            if (micOn != null) member.setMicOn(Boolean.TRUE.equals(micOn));
            if (camOn != null) member.setCamOn(Boolean.TRUE.equals(camOn));
            if (screenOn != null) member.setScreenOn(Boolean.TRUE.equals(screenOn));
            if (speaking != null) member.setSpeaking(Boolean.TRUE.equals(speaking));
        });
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VoiceMemberState {
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

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Membership {
        private long channelId;
        private long userId;
    }
}
