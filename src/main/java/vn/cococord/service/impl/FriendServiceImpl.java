package vn.cococord.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.cococord.dto.request.SendFriendRequestRequest;
import vn.cococord.dto.response.FriendRequestResponse;
import vn.cococord.dto.response.UserProfileResponse;
import vn.cococord.entity.mysql.BlockedUser;
import vn.cococord.entity.mysql.FriendRequest;
import vn.cococord.entity.mysql.FriendRequest.FriendRequestStatus;
import vn.cococord.entity.mysql.User;
import vn.cococord.exception.BadRequestException;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.exception.UnauthorizedException;
import vn.cococord.repository.IBlockedUserRepository;
import vn.cococord.repository.IFriendRequestRepository;
import vn.cococord.repository.IUserRepository;
import vn.cococord.service.IFriendService;
import vn.cococord.service.INotificationService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
@SuppressWarnings("null")
public class FriendServiceImpl implements IFriendService {

    private final IFriendRequestRepository friendRequestRepository;
    private final IBlockedUserRepository blockedUserRepository;
    private final IUserRepository userRepository;
    private final INotificationService notificationService;

    // ===== FRIEND REQUESTS =====

    @Override
    public FriendRequestResponse sendFriendRequest(SendFriendRequestRequest request, String username) {
        User sender = getUserByUsername(username);
        User receiver = userRepository.findById(request.getReceiverUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));

        // Can't friend yourself
        if (sender.getId().equals(receiver.getId())) {
            throw new BadRequestException("Bạn không thể kết bạn với chính mình.");
        }

        // Check if blocked
        if (blockedUserRepository.existsByUserIdAndBlockedUserId(receiver.getId(), sender.getId())) {
            throw new BadRequestException("Bạn không thể gửi lời mời kết bạn tới người dùng này.");
        }

        // Check if already friends
        if (friendRequestRepository.areFriends(sender.getId(), receiver.getId())) {
            throw new BadRequestException("Bạn đã là bạn bè với người này rồi.");
        }

        // Check if request already exists
        var existingRequest = friendRequestRepository.findBetweenUsers(sender.getId(), receiver.getId());
        if (existingRequest.isPresent()) {
            FriendRequest existing = existingRequest.get();
            if (existing.getStatus() == FriendRequestStatus.PENDING) {
                boolean sentByMe = existing.getSender() != null && existing.getSender().getId() != null
                        && existing.getSender().getId().equals(sender.getId());
                if (sentByMe) {
                    throw new BadRequestException("Bạn đã gửi lời mời kết bạn cho người này rồi.");
                }
                throw new BadRequestException(
                        "Người này đã gửi lời mời kết bạn cho bạn. Hãy vào tab \"Đang chờ xử lý\" để chấp nhận.");
            }
            // If was rejected/cancelled, can try again - delete old and create new
            if (existing.getStatus() == FriendRequestStatus.REJECTED ||
                    existing.getStatus() == FriendRequestStatus.CANCELLED) {
                friendRequestRepository.delete(existing);
            }
        }

        // Create new request
        FriendRequest friendRequest = FriendRequest.builder()
                .sender(sender)
                .receiver(receiver)
                .status(FriendRequestStatus.PENDING)
                .build();

        try {
            friendRequest = friendRequestRepository.save(friendRequest);
        } catch (DataIntegrityViolationException e) {
            // Most common case: double-submit race or existing unique constraint hit
            throw new BadRequestException("Bạn đã gửi lời mời kết bạn cho người này rồi.");
        }
        log.info("Friend request sent from {} to {}", sender.getUsername(), receiver.getUsername());

        // Send notification to receiver
        notificationService.sendFriendRequestNotification(sender, receiver);

        return convertToResponse(friendRequest);
    }

    @Override
    public void acceptFriendRequest(Long requestId, String username) {
        User user = getUserByUsername(username);
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Friend request not found"));

        // Only receiver can accept
        if (!request.getReceiver().getId().equals(user.getId())) {
            throw new UnauthorizedException("You can only accept requests sent to you");
        }

        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new BadRequestException("This request has already been handled");
        }

        request.setStatus(FriendRequestStatus.ACCEPTED);
        request.setRespondedAt(LocalDateTime.now());
        friendRequestRepository.save(request);

        // Send notification to the sender that their request was accepted
        notificationService.sendFriendAcceptedNotification(user, request.getSender());

        log.info("Friend request accepted: {} and {} are now friends",
                request.getSender().getUsername(), request.getReceiver().getUsername());
    }

    @Override
    public void declineFriendRequest(Long requestId, String username) {
        User user = getUserByUsername(username);
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Friend request not found"));

        if (!request.getReceiver().getId().equals(user.getId())) {
            throw new UnauthorizedException("You can only decline requests sent to you");
        }

        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new BadRequestException("This request has already been handled");
        }

        request.setStatus(FriendRequestStatus.REJECTED);
        request.setRespondedAt(LocalDateTime.now());
        friendRequestRepository.save(request);

        log.info("Friend request declined by {}", username);
    }

    @Override
    public void cancelFriendRequest(Long requestId, String username) {
        User user = getUserByUsername(username);
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Friend request not found"));

        if (!request.getSender().getId().equals(user.getId())) {
            throw new UnauthorizedException("You can only cancel requests you sent");
        }

        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new BadRequestException("This request has already been handled");
        }

        request.setStatus(FriendRequestStatus.CANCELLED);
        request.setRespondedAt(LocalDateTime.now());
        friendRequestRepository.save(request);

        log.info("Friend request cancelled by {}", username);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FriendRequestResponse> getPendingRequests(String username) {
        User user = getUserByUsername(username);
        return friendRequestRepository.findByReceiverIdAndStatus(user.getId(), FriendRequestStatus.PENDING)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FriendRequestResponse> getSentRequests(String username) {
        User user = getUserByUsername(username);
        return friendRequestRepository.findBySenderIdAndStatus(user.getId(), FriendRequestStatus.PENDING)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FriendRequestResponse> getAllFriendRequests(String username) {
        User user = getUserByUsername(username);
        List<FriendRequestResponse> result = new ArrayList<>();

        // Only return PENDING requests - received ones
        result.addAll(friendRequestRepository.findByReceiverIdAndStatus(user.getId(), FriendRequestStatus.PENDING)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList()));

        // Only return PENDING requests - sent ones
        result.addAll(friendRequestRepository.findBySenderIdAndStatus(user.getId(), FriendRequestStatus.PENDING)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList()));

        return result;
    }

    // ===== FRIENDS LIST =====

    @Override
    @Transactional(readOnly = true)
    public List<UserProfileResponse> getFriends(String username) {
        User user = getUserByUsername(username);
        List<FriendRequest> friendships = friendRequestRepository.findAcceptedFriendships(user.getId());

        return friendships.stream()
                .map(fr -> {
                    // Get the other user (friend)
                    User friend = fr.getSender().getId().equals(user.getId())
                            ? fr.getReceiver()
                            : fr.getSender();
                    return convertToUserProfile(friend);
                })
                .collect(Collectors.toList());
    }

    @Override
    public void removeFriend(Long friendId, String username) {
        User user = getUserByUsername(username);

        var friendRequest = friendRequestRepository.findBetweenUsers(user.getId(), friendId)
                .orElseThrow(() -> new ResourceNotFoundException("Friendship not found"));

        if (friendRequest.getStatus() != FriendRequestStatus.ACCEPTED) {
            throw new BadRequestException("You are not friends with this user");
        }

        // Delete the friendship
        friendRequestRepository.delete(friendRequest);
        log.info("Friendship removed between {} and user {}", username, friendId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean areFriends(Long userId1, Long userId2) {
        return friendRequestRepository.areFriends(userId1, userId2);
    }

    // ===== BLOCKED USERS =====

    @Override
    public void blockUser(Long userId, String username) {
        User blocker = getUserByUsername(username);
        User blocked = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (blocker.getId().equals(blocked.getId())) {
            throw new BadRequestException("You cannot block yourself");
        }

        if (blockedUserRepository.existsByUserIdAndBlockedUserId(blocker.getId(), blocked.getId())) {
            throw new BadRequestException("User is already blocked");
        }

        // Remove friendship if exists
        friendRequestRepository.findBetweenUsers(blocker.getId(), blocked.getId())
                .ifPresent(friendRequestRepository::delete);

        // Create block record
        BlockedUser blockRecord = BlockedUser.builder()
                .user(blocker)
                .blockedUser(blocked)
                .build();
        blockedUserRepository.save(blockRecord);

        log.info("{} blocked user {}", username, blocked.getUsername());
    }

    @Override
    public void unblockUser(Long userId, String username) {
        User blocker = getUserByUsername(username);

        if (!blockedUserRepository.existsByUserIdAndBlockedUserId(blocker.getId(), userId)) {
            throw new BadRequestException("User is not blocked");
        }

        blockedUserRepository.deleteByUserIdAndBlockedUserId(blocker.getId(), userId);
        log.info("{} unblocked user {}", username, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserProfileResponse> getBlockedUsers(String username) {
        User user = getUserByUsername(username);
        return blockedUserRepository.findByUserIdOrderByBlockedAtDesc(user.getId())
                .stream()
                .map(bu -> convertToUserProfile(bu.getBlockedUser()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasBlocked(Long blockerId, Long blockedId) {
        return blockedUserRepository.existsByUserIdAndBlockedUserId(blockerId, blockedId);
    }

    // ===== HELPER METHODS =====

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private FriendRequestResponse convertToResponse(FriendRequest request) {
        return FriendRequestResponse.builder()
                .id(request.getId())
                .senderId(request.getSender().getId())
                .senderUsername(request.getSender().getUsername())
                .senderDisplayName(request.getSender().getDisplayName())
                .senderAvatarUrl(request.getSender().getAvatarUrl())
                .receiverId(request.getReceiver().getId())
                .receiverUsername(request.getReceiver().getUsername())
                .receiverDisplayName(request.getReceiver().getDisplayName())
                .receiverAvatarUrl(request.getReceiver().getAvatarUrl())
                .status(request.getStatus().name())
                .createdAt(request.getCreatedAt())
                .respondedAt(request.getRespondedAt())
                .build();
    }

    private UserProfileResponse convertToUserProfile(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .status(user.getStatus() != null ? user.getStatus().name() : "OFFLINE")
                .createdAt(user.getCreatedAt())
                .build();
    }
}
