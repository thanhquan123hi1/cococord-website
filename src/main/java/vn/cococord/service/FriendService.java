package vn.cococord.service;

import vn.cococord.dto.FriendDto;
import vn.cococord.dto.FriendRequestDto;
import vn.cococord.entity.*;
import vn.cococord.repository.BlockRepository;
import vn.cococord.repository.FriendRequestRepository;
import vn.cococord.repository.FriendshipRepository;
import vn.cococord.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class FriendService {
    private final FriendRequestRepository friendRequestRepository;
    private final FriendshipRepository friendshipRepository;
    private final BlockRepository blockRepository;
    private final UserRepository userRepository;

    public FriendService(FriendRequestRepository friendRequestRepository,
                         FriendshipRepository friendshipRepository,
                         BlockRepository blockRepository,
                         UserRepository userRepository) {
        this.friendRequestRepository = friendRequestRepository;
        this.friendshipRepository = friendshipRepository;
        this.blockRepository = blockRepository;
        this.userRepository = userRepository;
    }

    public FriendRequest sendFriendRequest(User fromUser, String toUsername) {
        if (fromUser.getUsername().equalsIgnoreCase(toUsername)) {
            throw new RuntimeException("Cannot add yourself as friend");
        }
        User toUser = userRepository.findByUsername(toUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (isBlocked(toUser, fromUser)) {
            throw new RuntimeException("You are blocked by this user");
        }
        if (isBlocked(fromUser, toUser)) {
            throw new RuntimeException("You have blocked this user");
        }
        if (existsFriendship(fromUser, toUser)) {
            throw new RuntimeException("You are already friends");
        }
        FriendRequest request = new FriendRequest();
        request.setFromUser(fromUser);
        request.setToUser(toUser);
        request.setStatus(FriendRequestStatus.PENDING);
        return friendRequestRepository.save(request);
    }

    public FriendRequest acceptRequest(Long requestId, User currentUser) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        if (!request.getToUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Not authorized");
        }
        request.setStatus(FriendRequestStatus.ACCEPTED);
        friendRequestRepository.save(request);
        createFriendship(request.getFromUser(), request.getToUser());
        return request;
    }

    public FriendRequest rejectRequest(Long requestId, User currentUser) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        if (!request.getToUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Not authorized");
        }
        request.setStatus(FriendRequestStatus.REJECTED);
        return friendRequestRepository.save(request);
    }

    public List<FriendRequestDto> listReceivedRequests(User user) {
        List<FriendRequest> requests = friendRequestRepository.findAll().stream()
                .filter(fr -> fr.getToUser().getId().equals(user.getId()) && fr.getStatus() == FriendRequestStatus.PENDING)
                .collect(Collectors.toList());
        return requests.stream()
                .map(fr -> new FriendRequestDto(fr.getId(), fr.getFromUser().getUsername(), fr.getToUser().getUsername(), fr.getStatus()))
                .collect(Collectors.toList());
    }

    public List<FriendDto> listFriends(User user) {
        List<Friendship> friendships = friendshipRepository.findAll().stream()
                .filter(f -> f.getUser1().getId().equals(user.getId()) || f.getUser2().getId().equals(user.getId()))
                .collect(Collectors.toList());
        List<FriendDto> friends = new ArrayList<>();
        for (Friendship f : friendships) {
            User other = f.getUser1().getId().equals(user.getId()) ? f.getUser2() : f.getUser1();
            friends.add(new FriendDto(other.getId(), other.getUsername(), other.getDisplayName(), other.getAvatarUrl()));
        }
        return friends;
    }

    private boolean existsFriendship(User u1, User u2) {
        Optional<Friendship> existing = friendshipRepository.findAll().stream()
                .filter(f -> (f.getUser1().getId().equals(u1.getId()) && f.getUser2().getId().equals(u2.getId())) ||
                        (f.getUser1().getId().equals(u2.getId()) && f.getUser2().getId().equals(u1.getId())))
                .findFirst();
        return existing.isPresent();
    }

    private boolean isBlocked(User blocker, User blocked) {
        return blockRepository.findAll().stream()
                .anyMatch(b -> b.getBlocker().getId().equals(blocker.getId()) && b.getBlocked().getId().equals(blocked.getId()));
    }

    private void createFriendship(User u1, User u2) {
        Friendship friendship = new Friendship();
        if (u1.getId() < u2.getId()) {
            friendship.setUser1(u1);
            friendship.setUser2(u2);
        } else {
            friendship.setUser1(u2);
            friendship.setUser2(u1);
        }
        friendshipRepository.save(friendship);
    }
}