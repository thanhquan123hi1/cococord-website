package vn.cococord.service;

import java.util.List;
import java.util.Optional;

import vn.cococord.entity.voice.VoiceMemberState;
import vn.cococord.entity.voice.VoiceMembership;

public interface IVoiceRoomRegistry {

    List<VoiceMemberState> join(long channelId, VoiceMemberState member, String sessionId);

    List<VoiceMemberState> leave(long channelId, long userId);

    Optional<VoiceMembership> removeBySessionId(String sessionId);

    Optional<VoiceMemberState> getMember(long channelId, long userId);

    List<VoiceMemberState> snapshot(long channelId);

    void updateState(long channelId, long userId, Boolean micOn, Boolean camOn, Boolean screenOn, Boolean speaking);

}