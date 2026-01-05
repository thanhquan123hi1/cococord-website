package vn.cococord.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.request.EditMessageRequest;
import vn.cococord.dto.request.SendMessageRequest;
import vn.cococord.dto.response.ChatMessageResponse;
import vn.cococord.dto.websocket.MentionEvent;
import vn.cococord.dto.websocket.ReactionEvent;
import vn.cococord.dto.websocket.WebSocketEvent;
import vn.cococord.entity.mongodb.Message;
import vn.cococord.entity.mysql.Channel;
import vn.cococord.entity.mysql.User;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.exception.UnauthorizedException;
import vn.cococord.repository.IChannelRepository;
import vn.cococord.repository.IMessageRepository;
import vn.cococord.repository.IUserRepository;
import vn.cococord.service.IChannelService;
import vn.cococord.service.IMessageService;
import vn.cococord.service.INotificationService;
import vn.cococord.service.IPermissionService;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class MessageServiceImpl implements IMessageService {

    private final IMessageRepository messageRepository;
    private final IUserRepository userRepository;
    private final IChannelRepository channelRepository;
    private final IChannelService channelService;
    private final INotificationService notificationService;
    private final IPermissionService permissionService;
    private final SimpMessagingTemplate messagingTemplate;

    // Regex pattern for mentions: <@userId> format (e.g., <@123>)
    private static final Pattern MENTION_PATTERN = Pattern.compile("<@(\\d+)>");

    @Override
    public ChatMessageResponse sendMessage(SendMessageRequest request, String username) {
        // Check if user has access to channel
        if (!channelService.canUserAccessChannel(request.getChannelId(), username)) {
            throw new UnauthorizedException("You don't have access to this channel");
        }

        // Validate that either content or attachments is present
        boolean hasContent = request.getContent() != null && !request.getContent().trim().isEmpty();
        boolean hasAttachments = request.getAttachments() != null && !request.getAttachments().isEmpty();
        
        if (!hasContent && !hasAttachments) {
            throw new IllegalArgumentException("Message must have either content or attachments");
        }

        User user = getUserByUsername(username);

        Message message = convertToEntity(
                request,
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getAvatarUrl());

        // Detect mentions and save mentioned user IDs (only if content exists)
        List<Long> mentionedUserIds = hasContent ? extractMentionedUserIds(request.getContent()) : new ArrayList<>();
        message.setMentionedUserIds(mentionedUserIds);

        message = messageRepository.save(message);
        log.info("Message sent by user: {} in channel: {}", username, request.getChannelId());

        // Process mentions - create notifications and send WebSocket events
        if (!mentionedUserIds.isEmpty()) {
            processMentions(user, mentionedUserIds, request.getChannelId(), message.getId());
        }

        // Broadcast to channel via WebSocket
        ChatMessageResponse response = convertToResponse(message);
        messagingTemplate.convertAndSend("/topic/channel/" + request.getChannelId(), 
            new WebSocketEvent("message.created", response));

        return response;
    }

    @Override
    public ChatMessageResponse editMessage(EditMessageRequest request, String username) {
        Message message = messageRepository.findById(request.getMessageId())
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        User user = getUserByUsername(username);

        // Only message author can edit
        if (!message.getUserId().equals(user.getId())) {
            throw new UnauthorizedException("You can only edit your own messages");
        }

        // Add to edit history
        if (message.getEditHistory() == null) {
            message.setEditHistory(new ArrayList<>());
        }

        Message.EditHistory editHistory = Message.EditHistory.builder()
                .oldContent(message.getContent())
                .editedAt(LocalDateTime.now())
                .build();
        message.getEditHistory().add(editHistory);

        // Update content
        message.setContent(request.getContent());
        message.setIsEdited(true);
        message.setEditedAt(LocalDateTime.now());

        message = messageRepository.save(message);
        log.info("Message edited by user: {}, messageId: {}", username, request.getMessageId());

        // Broadcast update via WebSocket
        ChatMessageResponse response = convertToResponse(message);
        messagingTemplate.convertAndSend("/topic/channel/" + message.getChannelId(), 
            new WebSocketEvent("message.updated", response));

        return response;
    }

    @Override
    public void deleteMessage(String messageId, String username) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        User user = getUserByUsername(username);
        Long serverId = message.getServerId();

        // Check if user is message author or has MANAGE_MESSAGES permission
        boolean isAuthor = message.getUserId().equals(user.getId());
        boolean hasManagePermission = serverId != null && 
            permissionService.hasPermission(user.getId(), serverId, "MANAGE_MESSAGES");
        
        if (!isAuthor && !hasManagePermission) {
            throw new UnauthorizedException("You can only delete your own messages or need MANAGE_MESSAGES permission");
        }

        Long channelId = message.getChannelId();
        messageRepository.delete(message);
        log.info("Message deleted by user: {} (author: {}, hasPermission: {}), messageId: {}", 
            username, isAuthor, hasManagePermission, messageId);

        // Broadcast deletion via WebSocket
        messagingTemplate.convertAndSend("/topic/channel/" + channelId + "/delete", 
            messageId);
    }

    @Override
    @Transactional(readOnly = true)
    public ChatMessageResponse getMessageById(String messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        return convertToResponse(message);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getChannelMessages(Long channelId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Message> messages = messageRepository.findByChannelIdOrderByCreatedAtDesc(channelId, pageRequest);

        return messages.map(this::convertToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessageReplies(String parentMessageId) {
        List<Message> replies = messageRepository.findByParentMessageIdOrderByCreatedAtAsc(parentMessageId);

        return replies.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addReaction(String messageId, String emoji, String username) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        User user = getUserByUsername(username);

        // Initialize reactions list if null
        if (message.getReactions() == null) {
            message.setReactions(new ArrayList<>());
        }

        // Find existing reaction for this emoji
        Message.Reaction existingReaction = message.getReactions().stream()
                .filter(r -> r.getEmoji().equals(emoji))
                .findFirst()
                .orElse(null);

        if (existingReaction != null) {
            // Add user to existing reaction if not already present
            if (!existingReaction.getUserIds().contains(user.getId())) {
                existingReaction.getUserIds().add(user.getId());
                existingReaction.setCount(existingReaction.getUserIds().size());
            }
        } else {
            // Create new reaction
            Message.Reaction newReaction = Message.Reaction.builder()
                    .emoji(emoji)
                    .count(1)
                    .build();
            newReaction.getUserIds().add(user.getId());
            message.getReactions().add(newReaction);
        }

        // Limit to 20 unique reactions
        if (message.getReactions().size() > 20) {

        // Broadcast reaction update via WebSocket
        messagingTemplate.convertAndSend("/topic/channel/" + message.getChannelId(), 
            new WebSocketEvent("reaction.added", new ReactionEvent(messageId, emoji, user.getId(), user.getUsername())));
            throw new UnauthorizedException("Maximum 20 unique reactions allowed per message");
        }

        messageRepository.save(message);
        log.info("Reaction added to message: {} by user: {}, emoji: {}", messageId, username, emoji);
    }

    @Override
    @Transactional
    public void removeReaction(String messageId, String emoji, String username) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        User user = getUserByUsername(username);

        if (message.getReactions() == null) {
            return;
        }

        // Find and remove user from reaction
        message.getReactions().forEach(reaction -> {
            if (reaction.getEmoji().equals(emoji)) {
                reaction.getUserIds().remove(user.getId());
                reaction.setCount(reaction.getUserIds().size());
            }
        });

        // Remove reactions with zero count

        // Broadcast reaction removal via WebSocket
        messagingTemplate.convertAndSend("/topic/channel/" + message.getChannelId(), 
            new WebSocketEvent("reaction.removed", new ReactionEvent(messageId, emoji, user.getId(), user.getUsername())));
        message.getReactions().removeIf(r -> r.getCount() == 0 || r.getUserIds().isEmpty());

        messageRepository.save(message);
        log.info("Reaction removed from message: {} by user: {}, emoji: {}", messageId, username, emoji);
    }

    @Override
    @Transactional
    public void pinMessage(String messageId, String username) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        User user = getUserByUsername(username);

        message.setIsPinned(true);
        message.setPinnedAt(LocalDateTime.now());
        message.setPinnedBy(user.getId());

        messageRepository.save(message);
        log.info("Message pinned: {} by user: {}", messageId, username);
    }

    @Override
    @Transactional
    public void unpinMessage(String messageId, String username) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        message.setIsPinned(false);
        message.setPinnedAt(null);
        message.setPinnedBy(null);

        messageRepository.save(message);
        log.info("Message unpinned: {} by user: {}", messageId, username);
    }

    @Override
    public Message convertToEntity(SendMessageRequest request, Long userId, String username, String displayName,
            String avatarUrl) {
        // Convert AttachmentRequest to Message.Attachment
        List<Message.Attachment> attachments = new ArrayList<>();
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            attachments = request.getAttachments().stream()
                    .map(attReq -> Message.Attachment.builder()
                            .id(java.util.UUID.randomUUID().toString())
                            .fileName(attReq.getFileName())
                            .fileUrl(attReq.getFileUrl())
                            .fileType(attReq.getFileType())
                            .fileSize(attReq.getFileSize())
                            .build())
                    .collect(Collectors.toList());
        }

        return Message.builder()
                .channelId(request.getChannelId())
                .userId(userId)
                .username(username)
                .displayName(displayName)
                .avatarUrl(avatarUrl)
                .content(request.getContent())
                .type(Message.MessageType.TEXT)
                .parentMessageId(request.getParentMessageId())
                .threadId(request.getThreadId())
                .attachments(attachments)
                .mentionedUserIds(new ArrayList<>())
                .mentionedRoleIds(new ArrayList<>())
                .mentionEveryone(false)
                .reactions(new ArrayList<>())
                .isEdited(false)
                .editHistory(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Override
    public ChatMessageResponse convertToResponse(Message message) {
        List<ChatMessageResponse.AttachmentResponse> attachments = new ArrayList<>();

        if (message.getAttachments() != null) {
            attachments = message.getAttachments().stream()
                    .map(att -> ChatMessageResponse.AttachmentResponse.builder()
                            .url(att.getFileUrl())
                            .filename(att.getFileName())
                            .contentType(att.getFileType())
                            .size(att.getFileSize())
                            .build())
                    .collect(Collectors.toList());
        }

        return ChatMessageResponse.builder()
                .id(message.getId())
                .channelId(message.getChannelId())
                .serverId(message.getServerId())
                .userId(message.getUserId())
                .username(message.getUsername())
                .displayName(message.getDisplayName())
                .avatarUrl(message.getAvatarUrl())
                .content(message.getContent())
                .type(message.getType() != null ? message.getType().name() : "TEXT")
                .parentMessageId(message.getParentMessageId())
                .threadId(message.getThreadId())
                .attachments(attachments)
                .mentionedUserIds(message.getMentionedUserIds())
                .isEdited(message.getIsEdited())
                .editedAt(message.getEditedAt())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    // ================== Mention Processing Methods ==================

    /**
     * Extract mentioned user IDs from message content using regex pattern <@userId>
     * @param content The message content
     * @return List of unique mentioned user IDs
     */
    private List<Long> extractMentionedUserIds(String content) {
        if (content == null || content.isEmpty()) {
            return new ArrayList<>();
        }

        Set<Long> mentionedIds = new HashSet<>();
        Matcher matcher = MENTION_PATTERN.matcher(content);

        while (matcher.find()) {
            try {
                Long userId = Long.parseLong(matcher.group(1));
                mentionedIds.add(userId);
            } catch (NumberFormatException e) {
                log.warn("Invalid user ID in mention: {}", matcher.group(1));
            }
        }

        return new ArrayList<>(mentionedIds);
    }

    /**
     * Process mentions: create notifications and send WebSocket events to mentioned users
     * @param mentioner The user who mentioned others
     * @param mentionedUserIds List of mentioned user IDs
     * @param channelId The channel where the message was sent
     * @param messageId The message ID containing the mentions
     */
    private void processMentions(User mentioner, List<Long> mentionedUserIds, Long channelId, String messageId) {
        // Get channel info for notification
        Optional<Channel> channelOpt = channelRepository.findById(channelId);
        String channelName = channelOpt.map(Channel::getName).orElse("Unknown Channel");
        Long serverId = channelOpt.map(c -> c.getServer().getId()).orElse(null);

        for (Long mentionedUserId : mentionedUserIds) {
            // Don't notify if user mentions themselves
            if (mentionedUserId.equals(mentioner.getId())) {
                continue;
            }

            // Find the mentioned user
            Optional<User> mentionedUserOpt = userRepository.findById(mentionedUserId);
            if (mentionedUserOpt.isEmpty()) {
                log.warn("Mentioned user not found: {}", mentionedUserId);
                continue;
            }

            User mentionedUser = mentionedUserOpt.get();

            // 1. Create notification in database
            try {
                notificationService.sendMentionNotification(mentioner, mentionedUser, channelId, channelName);
                log.info("Created mention notification: mentioner={}, mentioned={}, channelId={}", 
                    mentioner.getUsername(), mentionedUser.getUsername(), channelId);
            } catch (Exception e) {
                log.error("Failed to create mention notification for user {}: {}", mentionedUserId, e.getMessage());
            }

            // 2. Send real-time WebSocket event for instant badge/sound notification
            try {
                MentionEvent mentionEvent = MentionEvent.builder()
                        .type("mention")
                        .mentionerId(mentioner.getId())
                        .mentionerUsername(mentioner.getUsername())
                        .mentionerDisplayName(mentioner.getDisplayName())
                        .mentionerAvatarUrl(mentioner.getAvatarUrl())
                        .channelId(channelId)
                        .channelName(channelName)
                        .serverId(serverId)
                        .messageId(messageId)
                        .build();

                messagingTemplate.convertAndSend(
                    "/topic/user." + mentionedUserId + ".mention", 
                    mentionEvent
                );
                log.debug("Sent mention WebSocket event to user {}", mentionedUserId);
            } catch (Exception e) {
                log.error("Failed to send mention WebSocket event to user {}: {}", mentionedUserId, e.getMessage());
            }
        }
    }
}
