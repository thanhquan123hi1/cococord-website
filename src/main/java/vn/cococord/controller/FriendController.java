package vn.cococord.controller;

import vn.cococord.dto.FriendDto;
import vn.cococord.dto.FriendRequestDto;
import vn.cococord.entity.User;
import vn.cococord.service.FriendService;
import vn.cococord.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/friends")
public class FriendController {
    private final FriendService friendService;
    private final UserService userService;
    public FriendController(FriendService friendService, UserService userService) {
        this.friendService = friendService;
        this.userService = userService;
    }
    @PostMapping("/requests")
    public ResponseEntity<Void> sendRequest(@RequestBody Map<String, String> body, Principal principal) {
        String toUsername = body.get("username");
        User fromUser = userService.findByUsername(principal.getName()).orElseThrow();
        friendService.sendFriendRequest(fromUser, toUsername);
        return ResponseEntity.ok().build();
    }
    @PostMapping("/requests/{id}/accept")
    public ResponseEntity<Void> acceptRequest(@PathVariable Long id, Principal principal) {
        User user = userService.findByUsername(principal.getName()).orElseThrow();
        friendService.acceptRequest(id, user);
        return ResponseEntity.ok().build();
    }
    @PostMapping("/requests/{id}/reject")
    public ResponseEntity<Void> rejectRequest(@PathVariable Long id, Principal principal) {
        User user = userService.findByUsername(principal.getName()).orElseThrow();
        friendService.rejectRequest(id, user);
        return ResponseEntity.ok().build();
    }
    @GetMapping
    public ResponseEntity<List<FriendDto>> listFriends(Principal principal) {
        User user = userService.findByUsername(principal.getName()).orElseThrow();
        List<FriendDto> friends = friendService.listFriends(user);
        return ResponseEntity.ok(friends);
    }
    @GetMapping("/requests")
    public ResponseEntity<List<FriendRequestDto>> listRequests(Principal principal) {
        User user = userService.findByUsername(principal.getName()).orElseThrow();
        List<FriendRequestDto> requests = friendService.listReceivedRequests(user);
        return ResponseEntity.ok(requests);
    }
}