package vn.cococord.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import vn.cococord.dto.request.CreateDMGroupRequest;
import vn.cococord.dto.response.DMGroupMemberResponse;
import vn.cococord.dto.response.DMGroupResponse;
import vn.cococord.entity.mysql.DirectMessageGroup;
import vn.cococord.entity.mysql.DirectMessageMember;
import vn.cococord.entity.mysql.User;
import vn.cococord.exception.BadRequestException;
import vn.cococord.exception.ForbiddenException;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.repository.IDirectMessageGroupRepository;
import vn.cococord.repository.IDirectMessageMemberRepository;
import vn.cococord.repository.IUserRepository;
import vn.cococord.service.IDMGroupService;

@Service
@RequiredArgsConstructor
@Transactional
public class DMGroupServiceImpl implements IDMGroupService {

    private final IDirectMessageGroupRepository dmGroupRepository;
    private final IDirectMessageMemberRepository dmMemberRepository;
    private final IUserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<DMGroupResponse> getDMGroupsForUser(String username) {
        User user = getUserByUsername(username);
        List<DirectMessageGroup> groups = dmGroupRepository.findAllByUserId(user.getId());
        return groups.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public DMGroupResponse createDMGroup(CreateDMGroupRequest request, String username) {
        User currentUser = getUserByUsername(username);
        List<Long> userIds = request.getUserIds();

        if (userIds == null || userIds.isEmpty()) {
            throw new BadRequestException("At least one user must be specified");
        }

        // Remove current user if in list to avoid duplicates
        userIds = userIds.stream()
                .filter(id -> !id.equals(currentUser.getId()))
                .collect(Collectors.toList());

        if (userIds.isEmpty()) {
            throw new BadRequestException("Cannot create DM with only yourself");
        }

        // Check if this is a 1-1 DM (single user) and if one already exists
        if (userIds.size() == 1) {
            Long targetUserId = userIds.get(0);
            Optional<DirectMessageGroup> existingDm = dmGroupRepository.findOneToOneDM(currentUser.getId(), targetUserId);
            if (existingDm.isPresent()) {
                return toResponse(existingDm.get());
            }
        }

        // Validate all users exist
        List<User> targetUsers = new ArrayList<>();
        for (Long userId : userIds) {
            User targetUser = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
            targetUsers.add(targetUser);
        }

        // Create the DM group
        boolean isGroup = userIds.size() > 1;
        DirectMessageGroup dmGroup = DirectMessageGroup.builder()
                .name(isGroup ? request.getName() : null)
                .owner(currentUser)
                .isGroup(isGroup)
                .iconUrl(request.getIconUrl())
                .build();

        dmGroup = dmGroupRepository.save(dmGroup);

        // Add current user as member
        DirectMessageMember ownerMember = DirectMessageMember.builder()
                .dmGroup(dmGroup)
                .user(currentUser)
                .build();
        dmMemberRepository.save(ownerMember);

        // Add target users as members
        for (User targetUser : targetUsers) {
            DirectMessageMember member = DirectMessageMember.builder()
                    .dmGroup(dmGroup)
                    .user(targetUser)
                    .build();
            dmMemberRepository.save(member);
        }

        return toResponse(dmGroup);
    }

    @Override
    @Transactional(readOnly = true)
    public DMGroupResponse getDMGroup(Long groupId, String username) {
        User user = getUserByUsername(username);
        DirectMessageGroup dmGroup = dmGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("DM group not found"));

        // Verify user is a member
        if (!dmGroupRepository.isUserMemberOfGroup(groupId, user.getId())) {
            throw new ForbiddenException("You are not a member of this DM group");
        }

        return toResponse(dmGroup);
    }

    @Override
    public void leaveDMGroup(Long groupId, String username) {
        User user = getUserByUsername(username);
        DirectMessageGroup dmGroup = dmGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("DM group not found"));

        // Verify user is a member
        if (!dmGroupRepository.isUserMemberOfGroup(groupId, user.getId())) {
            throw new ForbiddenException("You are not a member of this DM group");
        }

        // For 1-1 DMs, just remove the member (DM still exists for other user)
        // For group DMs, if owner leaves, delete the whole group OR transfer ownership
        if (dmGroup.getIsGroup() && dmGroup.getOwner().getId().equals(user.getId())) {
            // Owner leaving a group DM - delete the entire group
            dmGroupRepository.delete(dmGroup);
        } else {
            // Regular member leaving or 1-1 DM
            dmMemberRepository.deleteByDmGroupIdAndUserId(groupId, user.getId());

            // If no members left, delete the group
            if (dmGroupRepository.countMembersByDmGroupId(groupId) == 0) {
                dmGroupRepository.delete(dmGroup);
            }
        }
    }

    @Override
    public void addMemberToDMGroup(Long groupId, Long userId, String username) {
        User currentUser = getUserByUsername(username);
        DirectMessageGroup dmGroup = dmGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("DM group not found"));

        // Verify current user is a member
        if (!dmGroupRepository.isUserMemberOfGroup(groupId, currentUser.getId())) {
            throw new ForbiddenException("You are not a member of this DM group");
        }

        // Can only add members to group DMs
        if (!dmGroup.getIsGroup()) {
            throw new BadRequestException("Cannot add members to a 1-1 DM");
        }

        // Only owner can add members
        if (!dmGroup.getOwner().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Only the group owner can add members");
        }

        // Check if user already a member
        if (dmGroupRepository.isUserMemberOfGroup(groupId, userId)) {
            throw new BadRequestException("User is already a member of this group");
        }

        // Verify target user exists
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Add member
        DirectMessageMember member = DirectMessageMember.builder()
                .dmGroup(dmGroup)
                .user(targetUser)
                .build();
        dmMemberRepository.save(member);
    }

    @Override
    public void removeMemberFromDMGroup(Long groupId, Long userId, String username) {
        User currentUser = getUserByUsername(username);
        DirectMessageGroup dmGroup = dmGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("DM group not found"));

        // Verify current user is a member
        if (!dmGroupRepository.isUserMemberOfGroup(groupId, currentUser.getId())) {
            throw new ForbiddenException("You are not a member of this DM group");
        }

        // Can only remove members from group DMs
        if (!dmGroup.getIsGroup()) {
            throw new BadRequestException("Cannot remove members from a 1-1 DM");
        }

        // Only owner can remove members (or user can remove themselves)
        if (!dmGroup.getOwner().getId().equals(currentUser.getId()) && !currentUser.getId().equals(userId)) {
            throw new ForbiddenException("Only the group owner can remove members");
        }

        // Cannot remove owner
        if (dmGroup.getOwner().getId().equals(userId)) {
            throw new BadRequestException("Cannot remove the group owner");
        }

        // Verify member exists
        if (!dmGroupRepository.isUserMemberOfGroup(groupId, userId)) {
            throw new BadRequestException("User is not a member of this group");
        }

        // Remove member
        dmMemberRepository.deleteByDmGroupIdAndUserId(groupId, userId);
    }

    @Override
    public DMGroupResponse getOrCreateOneToOneDM(Long targetUserId, String username) {
        User currentUser = getUserByUsername(username);

        if (currentUser.getId().equals(targetUserId)) {
            throw new BadRequestException("Cannot create DM with yourself");
        }

        // Check for existing DM
        Optional<DirectMessageGroup> existingDm = dmGroupRepository.findOneToOneDM(currentUser.getId(), targetUserId);
        if (existingDm.isPresent()) {
            return toResponse(existingDm.get());
        }

        // Verify target user exists
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Create new 1-1 DM
        DirectMessageGroup dmGroup = DirectMessageGroup.builder()
                .owner(currentUser)
                .isGroup(false)
                .build();
        dmGroup = dmGroupRepository.save(dmGroup);

        // Add both users as members
        DirectMessageMember member1 = DirectMessageMember.builder()
                .dmGroup(dmGroup)
                .user(currentUser)
                .build();
        dmMemberRepository.save(member1);

        DirectMessageMember member2 = DirectMessageMember.builder()
                .dmGroup(dmGroup)
                .user(targetUser)
                .build();
        dmMemberRepository.save(member2);

        return toResponse(dmGroup);
    }

    // ===== Helper Methods =====

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private DMGroupResponse toResponse(DirectMessageGroup dmGroup) {
        List<DirectMessageMember> members = dmMemberRepository.findByDmGroupId(dmGroup.getId());

        return DMGroupResponse.builder()
                .id(dmGroup.getId())
                .name(dmGroup.getName())
                .ownerId(dmGroup.getOwner().getId())
                .ownerUsername(dmGroup.getOwner().getUsername())
                .isGroup(dmGroup.getIsGroup())
                .iconUrl(dmGroup.getIconUrl())
                .createdAt(dmGroup.getCreatedAt())
                .updatedAt(dmGroup.getUpdatedAt())
                .members(members.stream()
                        .map(this::toMemberResponse)
                        .collect(Collectors.toList()))
                .build();
    }

    private DMGroupMemberResponse toMemberResponse(DirectMessageMember member) {
        User user = member.getUser();
        return DMGroupMemberResponse.builder()
                .id(member.getId())
                .userId(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .joinedAt(member.getJoinedAt())
                .build();
    }
}
