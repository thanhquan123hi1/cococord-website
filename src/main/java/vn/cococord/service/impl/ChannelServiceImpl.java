package vn.cococord.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.cococord.dto.request.CreateChannelRequest;
import vn.cococord.dto.request.UpdateChannelRequest;
import vn.cococord.dto.response.ChannelResponse;
import vn.cococord.entity.mysql.Channel;
import vn.cococord.entity.mysql.Server;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.exception.UnauthorizedException;
import vn.cococord.repository.ChannelRepository;
import vn.cococord.repository.ServerRepository;
import vn.cococord.service.ChannelService;
import vn.cococord.service.ServerService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
@SuppressWarnings("null")
public class ChannelServiceImpl implements ChannelService {

    private final ChannelRepository channelRepository;
    private final ServerRepository serverRepository;
    private final ServerService serverService;

    @Override
    public ChannelResponse createChannel(Long serverId, CreateChannelRequest request, String username) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found with id: " + serverId));

        // Only server owner can create channels (can add admin/moderator check later)
        if (!serverService.isServerOwner(serverId, username)) {
            throw new UnauthorizedException("Only server owner can create channels");
        }

        // Get next position
        Integer nextPosition = channelRepository.findMaxPositionByServerId(serverId) + 1;

        Channel.ChannelType channelType = Channel.ChannelType.TEXT;
        if (request.getType() != null) {
            try {
                channelType = Channel.ChannelType.valueOf(request.getType().toUpperCase());
            } catch (IllegalArgumentException e) {
                channelType = Channel.ChannelType.TEXT;
            }
        }

        Channel channel = Channel.builder()
                .server(server)
                .name(request.getName())
                .type(channelType)
                .topic(request.getTopic())
                .position(nextPosition)
                .isPrivate(request.getIsPrivate() != null ? request.getIsPrivate() : false)
                .isNsfw(request.getIsNsfw() != null ? request.getIsNsfw() : false)
                .slowMode(request.getSlowMode() != null ? request.getSlowMode() : 0)
                .build();

        channel = channelRepository.save(channel);
        log.info("Channel created: {} in server: {} by user: {}", channel.getName(), server.getName(), username);

        return convertToResponse(channel);
    }

    @Override
    @Transactional(readOnly = true)
    public ChannelResponse getChannelById(Long channelId, String username) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found with id: " + channelId));

        // Check if user can access this channel
        if (!canUserAccessChannel(channelId, username)) {
            throw new UnauthorizedException("You don't have access to this channel");
        }

        return convertToResponse(channel);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChannelResponse> getServerChannels(Long serverId, String username) {
        // Check if user is member of server
        if (!serverService.isServerMember(serverId, username)) {
            throw new UnauthorizedException("You are not a member of this server");
        }

        List<Channel> channels = channelRepository.findByServerIdOrderByPosition(serverId);

        return channels.stream()
                .filter(channel -> !channel.getIsPrivate() || canUserAccessChannel(channel.getId(), username))
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ChannelResponse updateChannel(Long channelId, UpdateChannelRequest request, String username) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found with id: " + channelId));

        // Only server owner can update channels
        if (!serverService.isServerOwner(channel.getServer().getId(), username)) {
            throw new UnauthorizedException("Only server owner can update channels");
        }

        // Update fields
        if (request.getName() != null) {
            channel.setName(request.getName());
        }
        if (request.getTopic() != null) {
            channel.setTopic(request.getTopic());
        }
        if (request.getIsPrivate() != null) {
            channel.setIsPrivate(request.getIsPrivate());
        }
        if (request.getIsNsfw() != null) {
            channel.setIsNsfw(request.getIsNsfw());
        }
        if (request.getSlowMode() != null) {
            channel.setSlowMode(request.getSlowMode());
        }

        channel = channelRepository.save(channel);
        log.info("Channel updated: {} by user: {}", channel.getName(), username);

        return convertToResponse(channel);
    }

    @Override
    public void deleteChannel(Long channelId, String username) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found with id: " + channelId));

        // Only server owner can delete channels
        if (!serverService.isServerOwner(channel.getServer().getId(), username)) {
            throw new UnauthorizedException("Only server owner can delete channels");
        }

        channelRepository.delete(channel);
        log.info("Channel deleted: {} by user: {}", channel.getName(), username);
    }

    @Override
    public ChannelResponse updateChannelPosition(Long channelId, Integer position, String username) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found with id: " + channelId));

        // Only server owner can reorder channels
        if (!serverService.isServerOwner(channel.getServer().getId(), username)) {
            throw new UnauthorizedException("Only server owner can reorder channels");
        }

        channel.setPosition(position);
        channel = channelRepository.save(channel);
        log.info("Channel position updated: {} to position: {} by user: {}", channel.getName(), position, username);

        return convertToResponse(channel);
    }

    @Override
    public boolean canUserAccessChannel(Long channelId, String username) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found"));

        // Must be server member
        if (!serverService.isServerMember(channel.getServer().getId(), username)) {
            return false;
        }

        // If public channel, allow access
        if (!channel.getIsPrivate()) {
            return true;
        }

        // For private channels, check permissions (simplified - always allow for now)
        // TODO: Implement proper permission checking with ChannelPermission entity
        return true;
    }

    private ChannelResponse convertToResponse(Channel channel) {
        return ChannelResponse.builder()
                .id(channel.getId())
                .serverId(channel.getServer().getId())
                .categoryId(channel.getCategory() != null ? channel.getCategory().getId() : null)
                .name(channel.getName())
                .type(channel.getType().name())
                .topic(channel.getTopic())
                .position(channel.getPosition())
                .isPrivate(channel.getIsPrivate())
                .isNsfw(channel.getIsNsfw())
                .slowMode(channel.getSlowMode())
                .createdAt(channel.getCreatedAt())
                .updatedAt(channel.getUpdatedAt())
                .build();
    }
}
