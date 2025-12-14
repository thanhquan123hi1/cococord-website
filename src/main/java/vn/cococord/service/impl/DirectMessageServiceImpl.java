package vn.cococord.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.cococord.entity.mongodb.DirectMessage;
import vn.cococord.entity.mysql.DirectMessageGroup;
import vn.cococord.entity.mysql.DirectMessageMember;
import vn.cococord.entity.mysql.User;
import vn.cococord.exception.ForbiddenException;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.repository.IDirectMessageGroupRepository;
import vn.cococord.repository.IDirectMessageMemberRepository;
import vn.cococord.repository.IDirectMessageRepository;
import vn.cococord.repository.IUserRepository;
import vn.cococord.service.IDirectMessageService;
import vn.cococord.service.INotificationService;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DirectMessageServiceImpl implements IDirectMessageService {

    private static final int MAX_GROUP_DM_MEMBERS = 10;
    private static final int MESSAGE_EDIT_TIME_LIMIT_MINUTES = 15;

    private final IDirectMessageGroupRepository dmGroupRepository;
    private final IDirectMessageMemberRepository dmMemberRepository;
    private final IDirectMessageRepository directMessageRepository;
    private final IUserRepository userRepository;
    private final INotificationService notificationService;

    @Override
    @Transactional
    public DirectMessageGroup createOrGetOneToOneDM(Long userId1, Long userId2) {
        if (userId1.equals(userId2)) {
            throw new IllegalArgumentException("Cannot create DM with yourself");
        }

        // Check if DM already exists
        return dmGroupRepository.findOneToOneDM(userId1, userId2)
                .orElseGet(() -> {
                    // Create new 1-1 DM
                    @SuppressWarnings("null")
                    User user1 = userRepository.findById(userId1)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId1));
                    @SuppressWarnings("null")
                    User user2 = userRepository.findById(userId2)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId2));

                    DirectMessageGroup dmGroup = DirectMessageGroup.builder()
                            .owner(user1)
                            .isGroup(false)
                            .build();

                    @SuppressWarnings("null")
                    DirectMessageGroup savedGroup = dmGroupRepository.save(dmGroup);
                    dmGroup = savedGroup;

                    // Add both users as members
                    DirectMessageMember member1 = DirectMessageMember.builder()
                            .dmGroup(dmGroup)
                            .user(user1)
                            .build();

                    DirectMessageMember member2 = DirectMessageMember.builder()
                            .dmGroup(dmGroup)
                            .user(user2)
                            .build();

                    dmMemberRepository.save(member1);
                    dmMemberRepository.save(member2);

                    log.info("Created 1-1 DM between users {} and {}", userId1, userId2);
                    return dmGroup;
                });
    }

    @Override
    @Transactional
    public DirectMessageGroup createGroupDM(Long ownerId, List<Long> memberIds, String groupName) {
        if (memberIds.size() + 1 > MAX_GROUP_DM_MEMBERS) {
            throw new IllegalArgumentException("Group DM cannot have more than " + MAX_GROUP_DM_MEMBERS + " members");
        }

        @SuppressWarnings("null")
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found: " + ownerId));

        DirectMessageGroup dmGroup = DirectMessageGroup.builder()
                .owner(owner)
                .isGroup(true)
                .name(groupName)
                .build();

        @SuppressWarnings("null")
        DirectMessageGroup savedGroup2 = dmGroupRepository.save(dmGroup);
        dmGroup = savedGroup2;

        // Add owner as member
        DirectMessageMember ownerMember = DirectMessageMember.builder()
                .dmGroup(dmGroup)
                .user(owner)
                .build();
        dmMemberRepository.save(ownerMember);

        // Add other members
        Set<Long> uniqueMemberIds = new HashSet<>(memberIds);
        uniqueMemberIds.remove(ownerId); // Remove owner if included

        for (Long memberId : uniqueMemberIds) {
            @SuppressWarnings("null")
            User user = userRepository.findById(memberId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + memberId));

            DirectMessageMember member = DirectMessageMember.builder()
                    .dmGroup(dmGroup)
                    .user(user)
                    .build();
            dmMemberRepository.save(member);
        }

        log.info("Created Group DM '{}' with {} members", groupName, uniqueMemberIds.size() + 1);
        return dmGroup;
    }

    @Override
    @Transactional
    public void addMemberToGroup(Long dmGroupId, Long userId, Long requestingUserId) {
        @SuppressWarnings("null")
        DirectMessageGroup dmGroup = dmGroupRepository.findById(dmGroupId)
                .orElseThrow(() -> new ResourceNotFoundException("DM Group not found"));

        if (!dmGroup.getIsGroup()) {
            throw new IllegalArgumentException("Cannot add members to 1-1 DM");
        }

        // Only owner can add members
        if (!dmGroup.getOwner().getId().equals(requestingUserId)) {
            throw new ForbiddenException("Only group owner can add members");
        }

        // Check member limit
        long memberCount = dmGroupRepository.countMembersByDmGroupId(dmGroupId);
        if (memberCount >= MAX_GROUP_DM_MEMBERS) {
            throw new IllegalArgumentException("Group DM has reached maximum members (" + MAX_GROUP_DM_MEMBERS + ")");
        }

        // Check if already member
        if (dmMemberRepository.existsByDmGroupIdAndUserId(dmGroupId, userId)) {
            throw new IllegalArgumentException("User is already a member");
        }

        @SuppressWarnings("null")
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        @SuppressWarnings("null")
        User adder = userRepository.findById(requestingUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Requesting user not found"));

        DirectMessageMember member = DirectMessageMember.builder()
                .dmGroup(dmGroup)
                .user(user)
                .build();

        dmMemberRepository.save(member);

        // Send notification to added user
        notificationService.sendAddedToGroupDMNotification(adder, user, dmGroupId, dmGroup.getName());

        log.info("Added user {} to Group DM {}", userId, dmGroupId);
    }

    @Override
    @Transactional
    public void removeMemberFromGroup(Long dmGroupId, Long userId, Long requestingUserId) {
        @SuppressWarnings("null")
        DirectMessageGroup dmGroup = dmGroupRepository.findById(dmGroupId)
                .orElseThrow(() -> new ResourceNotFoundException("DM Group not found"));

        if (!dmGroup.getIsGroup()) {
            throw new IllegalArgumentException("Cannot remove members from 1-1 DM");
        }

        // Owner can kick anyone, members can only leave themselves
        boolean isOwner = dmGroup.getOwner().getId().equals(requestingUserId);
        boolean isSelfLeaving = userId.equals(requestingUserId);

        if (!isOwner && !isSelfLeaving) {
            throw new ForbiddenException("You can only remove yourself from the group");
        }

        // Cannot remove owner
        if (userId.equals(dmGroup.getOwner().getId())) {
            throw new IllegalArgumentException("Cannot remove group owner. Transfer ownership or delete the group.");
        }

        dmMemberRepository.deleteByDmGroupIdAndUserId(dmGroupId, userId);

        // Send notification to removed user (only if kicked, not if self-leaving)
        if (!isSelfLeaving) {
            User removedUser = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            notificationService.sendRemovedFromGroupDMNotification(dmGroupId, dmGroup.getName(), removedUser);
        }

        log.info("Removed user {} from Group DM {}", userId, dmGroupId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DirectMessageGroup> getDMGroupsForUser(Long userId) {
        return dmGroupRepository.findAllByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public DirectMessageGroup getDMGroupById(Long dmGroupId, Long requestingUserId) {
        @SuppressWarnings("null")
        DirectMessageGroup dmGroup = dmGroupRepository.findById(dmGroupId)
                .orElseThrow(() -> new ResourceNotFoundException("DM Group not found"));

        // Check if user is member
        if (!dmGroupRepository.isUserMemberOfGroup(dmGroupId, requestingUserId)) {
            throw new ForbiddenException("You are not a member of this DM group");
        }

        return dmGroup;
    }

    @Override
    @Transactional
    public DirectMessageGroup updateGroupDM(Long dmGroupId, Long ownerId, String newName, String newIconUrl) {
        @SuppressWarnings("null")
        DirectMessageGroup dmGroup = dmGroupRepository.findById(dmGroupId)
                .orElseThrow(() -> new ResourceNotFoundException("DM Group not found"));

        if (!dmGroup.getIsGroup()) {
            throw new IllegalArgumentException("Cannot update 1-1 DM");
        }

        if (!dmGroup.getOwner().getId().equals(ownerId)) {
            throw new ForbiddenException("Only group owner can update group info");
        }

        if (newName != null && !newName.trim().isEmpty()) {
            dmGroup.setName(newName);
        }

        if (newIconUrl != null) {
            dmGroup.setIconUrl(newIconUrl);
        }

        return dmGroupRepository.save(dmGroup);
    }

    @Override
    @Transactional
    public void deleteDMGroup(Long dmGroupId, Long requestingUserId) {
        @SuppressWarnings("null")
        DirectMessageGroup dmGroup = dmGroupRepository.findById(dmGroupId)
                .orElseThrow(() -> new ResourceNotFoundException("DM Group not found"));

        if (dmGroup.getIsGroup()) {
            // Only owner can delete group DM
            if (!dmGroup.getOwner().getId().equals(requestingUserId)) {
                throw new ForbiddenException("Only group owner can delete group DM");
            }
        } else {
            // For 1-1 DM, both users can delete
            if (!dmGroupRepository.isUserMemberOfGroup(dmGroupId, requestingUserId)) {
                throw new ForbiddenException("You are not a member of this DM");
            }
        }

        // Delete all messages
        directMessageRepository.deleteAllByDmGroupId(dmGroupId);

        // Delete all members
        List<DirectMessageMember> members = dmMemberRepository.findByDmGroupId(dmGroupId);
        @SuppressWarnings("null")
        List<DirectMessageMember> toDelete = members;
        dmMemberRepository.deleteAll(toDelete);

        // Delete group
        dmGroupRepository.delete(dmGroup);

        log.info("Deleted DM Group {} by user {}", dmGroupId, requestingUserId);
    }

    @Override
    @Transactional
    public DirectMessage sendDirectMessage(Long dmGroupId, Long senderId, String content) {
        return sendDirectMessageWithAttachments(dmGroupId, senderId, content, null);
    }

    @Override
    @Transactional
    public DirectMessage sendDirectMessageWithAttachments(Long dmGroupId, Long senderId, String content,
            List<String> attachmentUrls) {
        // Verify DM group exists and user is member
        if (!dmGroupRepository.isUserMemberOfGroup(dmGroupId, senderId)) {
            throw new ForbiddenException("You are not a member of this DM group");
        }

        @SuppressWarnings("null")
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        DirectMessage.DirectMessageBuilder messageBuilder = DirectMessage.builder()
                .dmGroupId(dmGroupId)
                .senderId(senderId)
                .senderUsername(sender.getUsername())
                .senderDisplayName(sender.getDisplayName())
                .senderAvatarUrl(sender.getAvatarUrl())
                .content(content)
                .type(DirectMessage.MessageType.TEXT);

        if (attachmentUrls != null && !attachmentUrls.isEmpty()) {
            List<DirectMessage.Attachment> attachments = attachmentUrls.stream()
                    .map(url -> DirectMessage.Attachment.builder()
                            .fileUrl(url)
                            .fileName(extractFilename(url))
                            .build())
                    .collect(Collectors.toList());
            messageBuilder.attachments(attachments);
        }

        DirectMessage message = messageBuilder.build();
        @SuppressWarnings("null")
        DirectMessage savedMessage = directMessageRepository.save(message);
        message = savedMessage;

        // Send notifications to other members (except sender)
        @SuppressWarnings("null")
        DirectMessageGroup dmGroup = dmGroupRepository.findById(dmGroupId)
                .orElseThrow(() -> new ResourceNotFoundException("DM Group not found"));

        List<Long> memberIds = dmMemberRepository.findByDmGroupId(dmGroupId).stream()
                .map(m -> m.getUser().getId())
                .filter(id -> !id.equals(senderId))
                .toList();

        for (Long memberId : memberIds) {
            @SuppressWarnings("null")
            User receiver = userRepository.findById(memberId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            String preview = content != null && !content.isBlank() ? content : "[Attachment]";
            notificationService.sendNewDirectMessageNotification(sender, receiver, dmGroupId, preview);
        }

        log.info("Sent direct message in DM group {} by user {}", dmGroupId, senderId);
        return message;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DirectMessage> getDirectMessages(Long dmGroupId, Long requestingUserId, Pageable pageable) {
        // Verify user is member
        if (!dmGroupRepository.isUserMemberOfGroup(dmGroupId, requestingUserId)) {
            throw new ForbiddenException("You are not a member of this DM group");
        }

        return directMessageRepository.findByDmGroupIdAndIsDeletedFalseOrderByCreatedAtDesc(dmGroupId, pageable);
    }

    @Override
    @Transactional
    public DirectMessage editDirectMessage(String messageId, Long senderId, String newContent) {
        @SuppressWarnings("null")
        DirectMessage message = directMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (!message.getSenderId().equals(senderId)) {
            throw new ForbiddenException("You can only edit your own messages");
        }

        if (message.getIsDeleted()) {
            throw new IllegalArgumentException("Cannot edit deleted message");
        }

        // Check edit time limit
        LocalDateTime editDeadline = message.getCreatedAt().plusMinutes(MESSAGE_EDIT_TIME_LIMIT_MINUTES);
        if (LocalDateTime.now().isAfter(editDeadline)) {
            throw new IllegalArgumentException("Message edit time limit exceeded (15 minutes)");
        }

        message.setContent(newContent);
        message.setIsEdited(true);
        message.setEditedAt(LocalDateTime.now());

        return directMessageRepository.save(message);
    }

    @Override
    @Transactional
    public void deleteDirectMessage(String messageId, Long requestingUserId) {
        @SuppressWarnings("null")
        DirectMessage message = directMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        @SuppressWarnings("null")
        DirectMessageGroup dmGroup = dmGroupRepository.findById(message.getDmGroupId())
                .orElseThrow(() -> new ResourceNotFoundException("DM Group not found"));

        // Sender can delete their own messages, or group owner can delete any message
        boolean isSender = message.getSenderId().equals(requestingUserId);
        boolean isOwner = dmGroup.getOwner().getId().equals(requestingUserId);

        if (!isSender && !isOwner) {
            throw new ForbiddenException("You can only delete your own messages");
        }

        message.setIsDeleted(true);
        message.setDeletedAt(LocalDateTime.now());
        directMessageRepository.save(message);

        log.info("Deleted message {} in DM group {}", messageId, message.getDmGroupId());
    }

    @Override
    @Transactional
    public void markAsRead(Long dmGroupId, Long userId) {
        @SuppressWarnings("unused")
        DirectMessageMember member = dmMemberRepository.findByDmGroupIdAndUserId(dmGroupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in DM group"));

        dmMemberRepository.updateLastReadAt(dmGroupId, userId, LocalDateTime.now());
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long dmGroupId, Long userId) {
        DirectMessageMember member = dmMemberRepository.findByDmGroupIdAndUserId(dmGroupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in DM group"));

        LocalDateTime lastReadAt = member.getLastReadAt();
        if (lastReadAt == null) {
            lastReadAt = member.getJoinedAt();
        }

        return directMessageRepository.countUnreadMessages(dmGroupId, lastReadAt, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DirectMessage> searchMessages(Long dmGroupId, Long userId, String searchTerm) {
        // Verify user is member
        if (!dmGroupRepository.isUserMemberOfGroup(dmGroupId, userId)) {
            throw new ForbiddenException("You are not a member of this DM group");
        }

        return directMessageRepository.searchInDmGroup(dmGroupId, searchTerm);
    }

    @Override
    @Transactional
    public void toggleMute(Long dmGroupId, Long userId, boolean muted) {
        DirectMessageMember member = dmMemberRepository.findByDmGroupIdAndUserId(dmGroupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in DM group"));

        member.setIsMuted(muted);
        dmMemberRepository.save(member);
    }

    private String extractFilename(String url) {
        int lastSlash = url.lastIndexOf('/');
        return lastSlash >= 0 ? url.substring(lastSlash + 1) : url;
    }
}
