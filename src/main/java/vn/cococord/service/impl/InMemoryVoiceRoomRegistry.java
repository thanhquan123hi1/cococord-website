package vn.cococord.service.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import vn.cococord.entity.voice.VoiceMemberState;
import vn.cococord.entity.voice.VoiceMembership;
import vn.cococord.service.IVoiceRoomRegistry;

@Component
public class InMemoryVoiceRoomRegistry implements IVoiceRoomRegistry {

    private final ConcurrentHashMap<Long, ConcurrentHashMap<Long, VoiceMemberState>> rooms = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, VoiceMembership> membershipBySessionId = new ConcurrentHashMap<>();

    @Override
    public List<VoiceMemberState> join(long channelId, VoiceMemberState member, String sessionId) {
        rooms.computeIfAbsent(channelId, __ -> new ConcurrentHashMap<>())
                .put(member.getUserId(), member);

        if (sessionId != null) {
            membershipBySessionId.put(sessionId, new VoiceMembership(channelId, member.getUserId()));
        }

        return snapshot(channelId);
    }

    @Override
    public List<VoiceMemberState> leave(long channelId, long userId) {
        ConcurrentHashMap<Long, VoiceMemberState> room = rooms.get(channelId);
        if (room == null)
            return Collections.emptyList();

        room.remove(userId);
        if (room.isEmpty()) {
            rooms.remove(channelId);
        }

        return snapshot(channelId);
    }

    @Override
    public Optional<VoiceMembership> removeBySessionId(String sessionId) {
        if (sessionId == null)
            return Optional.empty();
        VoiceMembership membership = membershipBySessionId.remove(sessionId);
        if (membership == null)
            return Optional.empty();

        leave(membership.getChannelId(), membership.getUserId());
        return Optional.of(membership);
    }

    @Override
    public Optional<VoiceMemberState> getMember(long channelId, long userId) {
        Map<Long, VoiceMemberState> room = rooms.get(channelId);
        if (room == null)
            return Optional.empty();
        return Optional.ofNullable(room.get(userId));
    }

    @Override
    public List<VoiceMemberState> snapshot(long channelId) {
        Map<Long, VoiceMemberState> room = rooms.get(channelId);
        if (room == null || room.isEmpty())
            return Collections.emptyList();
        return new ArrayList<>(room.values());
    }

    @Override
    public void updateState(long channelId, long userId, Boolean micOn, Boolean camOn, Boolean screenOn,
            Boolean speaking) {
        getMember(channelId, userId).ifPresent(member -> {
            if (micOn != null)
                member.setMicOn(Boolean.TRUE.equals(micOn));
            if (camOn != null)
                member.setCamOn(Boolean.TRUE.equals(camOn));
            if (screenOn != null)
                member.setScreenOn(Boolean.TRUE.equals(screenOn));
            if (speaking != null)
                member.setSpeaking(Boolean.TRUE.equals(speaking));
        });
    }
}