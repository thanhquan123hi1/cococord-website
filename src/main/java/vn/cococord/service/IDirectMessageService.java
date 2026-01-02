package vn.cococord.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.cococord.entity.mongodb.DirectMessage;
import vn.cococord.entity.mysql.DirectMessageGroup;

import java.util.List;

/**
 * Service interface for Direct Message operations (1-1 and Group DM)
 */
public interface IDirectMessageService {

    /**
     * Find other user IDs in a 1-1 DM group.
     */
    List<Long> findOtherUserIds(Long dmGroupId, Long userId);

    /**
     * Create or get existing 1-1 DM between two users
     */
    DirectMessageGroup createOrGetOneToOneDM(Long userId1, Long userId2);

    /**
     * Create a new group DM (max 10 members including owner)
     */
    DirectMessageGroup createGroupDM(Long ownerId, List<Long> memberIds, String groupName);

    /**
     * Add member to group DM
     */
    void addMemberToGroup(Long dmGroupId, Long userId, Long requestingUserId);

    /**
     * Remove member from group DM (owner can kick, member can leave)
     */
    void removeMemberFromGroup(Long dmGroupId, Long userId, Long requestingUserId);

    /**
     * Get all DM groups for a user
     */
    List<DirectMessageGroup> getDMGroupsForUser(Long userId);

    /**
     * Get DM group by ID (with permission check)
     */
    DirectMessageGroup getDMGroupById(Long dmGroupId, Long requestingUserId);

    /**
     * Update group DM info (name, icon) - only owner
     */
    DirectMessageGroup updateGroupDM(Long dmGroupId, Long ownerId, String newName, String newIconUrl);

    /**
     * Delete DM group - only owner can delete group DM, 1-1 DM both users can
     * delete
     */
    void deleteDMGroup(Long dmGroupId, Long requestingUserId);

    /**
     * Send a direct message
     */
    DirectMessage sendDirectMessage(Long dmGroupId, Long senderId, String content);

    /**
     * Send message with attachments
     */
    DirectMessage sendDirectMessageWithAttachments(Long dmGroupId, Long senderId, String content,
            List<String> attachmentUrls);

    /**
     * Get messages in DM group with pagination
     */
    Page<DirectMessage> getDirectMessages(Long dmGroupId, Long requestingUserId, Pageable pageable);

    /**
     * Edit direct message (only sender can edit within 15 minutes)
     */
    DirectMessage editDirectMessage(String messageId, Long senderId, String newContent);

    /**
     * Delete direct message (sender can delete anytime, owner can delete in group)
     */
    void deleteDirectMessage(String messageId, Long requestingUserId);

    /**
     * Mark messages as read
     */
    void markAsRead(Long dmGroupId, Long userId);

    /**
     * Get unread message count for user
     */
    long getUnreadCount(Long dmGroupId, Long userId);

    /**
     * Search messages in DM group
     */
    List<DirectMessage> searchMessages(Long dmGroupId, Long userId, String searchTerm);

    /**
     * Mute/unmute DM group
     */
    void toggleMute(Long dmGroupId, Long userId, boolean muted);
}
