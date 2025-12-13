package vn.cococord.graphql;

import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import vn.cococord.dto.request.SendFriendRequestRequest;
import vn.cococord.dto.response.FriendRequestResponse;
import vn.cococord.dto.response.MessageResponse;
import vn.cococord.dto.response.UserProfileResponse;
import vn.cococord.service.IFriendService;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class FriendGraphQLResolver {

    private final IFriendService friendService;

    @QueryMapping
    public List<UserProfileResponse> friends(@AuthenticationPrincipal UserDetails userDetails) {
        return friendService.getFriends(userDetails.getUsername());
    }

    @QueryMapping
    public List<FriendRequestResponse> friendRequests(@AuthenticationPrincipal UserDetails userDetails) {
        return friendService.getAllFriendRequests(userDetails.getUsername());
    }

    @QueryMapping
    public List<FriendRequestResponse> pendingFriendRequests(@AuthenticationPrincipal UserDetails userDetails) {
        return friendService.getPendingRequests(userDetails.getUsername());
    }

    @QueryMapping
    public List<FriendRequestResponse> sentFriendRequests(@AuthenticationPrincipal UserDetails userDetails) {
        return friendService.getSentRequests(userDetails.getUsername());
    }

    @QueryMapping
    public List<UserProfileResponse> blockedUsers(@AuthenticationPrincipal UserDetails userDetails) {
        return friendService.getBlockedUsers(userDetails.getUsername());
    }

    @MutationMapping
    public FriendRequestResponse sendFriendRequest(
            @Argument Long receiverUserId,
            @AuthenticationPrincipal UserDetails userDetails) {
        SendFriendRequestRequest request = new SendFriendRequestRequest();
        request.setReceiverUserId(receiverUserId);
        return friendService.sendFriendRequest(request, userDetails.getUsername());
    }

    @MutationMapping
    public MessageResponse acceptFriendRequest(
            @Argument Long requestId,
            @AuthenticationPrincipal UserDetails userDetails) {
        friendService.acceptFriendRequest(requestId, userDetails.getUsername());
        return new MessageResponse("Friend request accepted successfully");
    }

    @MutationMapping
    public MessageResponse declineFriendRequest(
            @Argument Long requestId,
            @AuthenticationPrincipal UserDetails userDetails) {
        friendService.declineFriendRequest(requestId, userDetails.getUsername());
        return new MessageResponse("Friend request declined");
    }

    @MutationMapping
    public MessageResponse cancelFriendRequest(
            @Argument Long requestId,
            @AuthenticationPrincipal UserDetails userDetails) {
        friendService.cancelFriendRequest(requestId, userDetails.getUsername());
        return new MessageResponse("Friend request cancelled");
    }

    @MutationMapping
    public MessageResponse removeFriend(
            @Argument Long friendId,
            @AuthenticationPrincipal UserDetails userDetails) {
        friendService.removeFriend(friendId, userDetails.getUsername());
        return new MessageResponse("Friend removed successfully");
    }

    @MutationMapping
    public MessageResponse blockUser(
            @Argument Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        friendService.blockUser(userId, userDetails.getUsername());
        return new MessageResponse("User blocked successfully");
    }

    @MutationMapping
    public MessageResponse unblockUser(
            @Argument Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        friendService.unblockUser(userId, userDetails.getUsername());
        return new MessageResponse("User unblocked successfully");
    }
}
