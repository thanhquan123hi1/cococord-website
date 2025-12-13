package vn.cococord.service;

import vn.cococord.dto.request.CreateChannelRequest;
import vn.cococord.dto.request.UpdateChannelRequest;
import vn.cococord.dto.response.ChannelResponse;

import java.util.List;

public interface IChannelService {

    ChannelResponse createChannel(Long serverId, CreateChannelRequest request, String username);

    ChannelResponse getChannelById(Long channelId, String username);

    List<ChannelResponse> getServerChannels(Long serverId, String username);

    ChannelResponse updateChannel(Long channelId, UpdateChannelRequest request, String username);

    void deleteChannel(Long channelId, String username);

    ChannelResponse updateChannelPosition(Long channelId, Integer position, String username);

    boolean canUserAccessChannel(Long channelId, String username);
}
