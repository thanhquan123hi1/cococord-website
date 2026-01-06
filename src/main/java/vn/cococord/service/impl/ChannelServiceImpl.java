package vn.cococord.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.request.CreateChannelRequest;
import vn.cococord.dto.request.UpdateChannelRequest;
import vn.cococord.dto.response.ChannelResponse;
import vn.cococord.entity.mysql.Category;
import vn.cococord.entity.mysql.Channel;
import vn.cococord.entity.mysql.Server;
import vn.cococord.entity.mysql.User;
import vn.cococord.exception.BadRequestException;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.exception.UnauthorizedException;
import vn.cococord.repository.ICategoryRepository;
import vn.cococord.repository.IChannelRepository;
import vn.cococord.repository.IServerRepository;
import vn.cococord.repository.IUserRepository;
import vn.cococord.service.IChannelService;
import vn.cococord.service.IPermissionService;
import vn.cococord.service.IServerService;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
@SuppressWarnings("null")
public class ChannelServiceImpl implements IChannelService {

    private final IChannelRepository channelRepository;
    private final ICategoryRepository categoryRepository;
    private final IServerRepository serverRepository;
    private final IUserRepository userRepository;
    private final IServerService serverService;
    private final IPermissionService permissionService;

    private static final int MAX_CHANNELS_PER_CATEGORY = 50;

    @Override
    public ChannelResponse createChannel(Long serverId, CreateChannelRequest request, String username) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found with id: " + serverId));

        User user = getUserByUsername(username);
        
        // Check if user has MANAGE_CHANNELS permission
        if (!permissionService.canManageChannels(user.getId(), serverId)) {
            throw new UnauthorizedException("You don't have permission to create channels");
        }

        // Validate channel name (lowercase, no spaces, use hyphens)
        String channelName = normalizeChannelName(request.getName());

        // Check category limit if categoryId is provided
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            
            Long channelCount = categoryRepository.countChannelsByCategoryId(request.getCategoryId());
            if (channelCount >= MAX_CHANNELS_PER_CATEGORY) {
                throw new BadRequestException("Category has reached maximum channel limit (" + MAX_CHANNELS_PER_CATEGORY + ")");
            }
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
                .category(category)
                .name(channelName)
                .type(channelType)
                .topic(request.getTopic())
                .position(request.getPosition() != null ? request.getPosition() : nextPosition)
                .isPrivate(request.getIsPrivate() != null ? request.getIsPrivate() : false)
                .isNsfw(request.getIsNsfw() != null ? request.getIsNsfw() : false)
                .isDefault(false)
                .slowMode(request.getSlowMode() != null ? request.getSlowMode() : 0)
                .build();

        channel = channelRepository.save(channel);
        log.info("Channel created: {} in server: {} by user: {}", channel.getName(), server.getName(), username);

        return convertToResponse(channel);
    }

    private String normalizeChannelName(String name) {
        if (name == null || name.isBlank()) {
            throw new BadRequestException("Channel name is required");
        }
        // Convert to lowercase, replace spaces with hyphens, remove special characters
        return name.toLowerCase()
                .trim()
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9-]", "")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
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

        User user = getUserByUsername(username);
        
        // Check if user has MANAGE_CHANNELS permission
        if (!permissionService.canManageChannels(user.getId(), channel.getServer().getId())) {
            throw new UnauthorizedException("You don't have permission to update channels");
        }

        // Update fields
        if (request.getName() != null) {
            channel.setName(normalizeChannelName(request.getName()));
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

        // Cannot delete default channel
        if (channel.getIsDefault()) {
            throw new BadRequestException("Cannot delete the default channel. Create another channel first.");
        }

        User user = getUserByUsername(username);
        
        // Check if user has MANAGE_CHANNELS permission
        if (!permissionService.canManageChannels(user.getId(), channel.getServer().getId())) {
            throw new UnauthorizedException("You don't have permission to delete channels");
        }

        channelRepository.delete(channel);
        log.info("Channel deleted: {} by user: {}", channel.getName(), username);
    }

    @Override
    public ChannelResponse updateChannelPosition(Long channelId, Integer position, String username) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found with id: " + channelId));

        User user = getUserByUsername(username);
        
        // Check if user has MANAGE_CHANNELS permission
        if (!permissionService.canManageChannels(user.getId(), channel.getServer().getId())) {
            throw new UnauthorizedException("You don't have permission to reorder channels");
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

        // For private channels, check VIEW_CHANNEL permission using ChannelPermission system
        User user = getUserByUsername(username);
        return permissionService.hasChannelPermission(user.getId(), channelId, "VIEW_CHANNEL");
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private ChannelResponse convertToResponse(Channel channel) {
        return ChannelResponse.builder()
                .id(channel.getId())
                .serverId(channel.getServer().getId())
                .categoryId(channel.getCategory() != null ? channel.getCategory().getId() : null)
                .categoryName(channel.getCategory() != null ? channel.getCategory().getName() : null)
                .name(channel.getName())
                .type(channel.getType().name())
                .topic(channel.getTopic())
                .position(channel.getPosition())
                .isPrivate(channel.getIsPrivate())
                .isNsfw(channel.getIsNsfw())
                .isDefault(channel.getIsDefault())
                .slowMode(channel.getSlowMode())
                .createdAt(channel.getCreatedAt())
                .updatedAt(channel.getUpdatedAt())
                .build();
    }
}
