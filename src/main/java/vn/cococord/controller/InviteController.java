package vn.cococord.controller;

import vn.cococord.dto.ServerInviteDto;
import vn.cococord.entity.Server;
import vn.cococord.entity.ServerInvite;
import vn.cococord.entity.User;
import vn.cococord.service.ServerInviteService;
import vn.cococord.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/invites")
public class InviteController {

    private final ServerInviteService inviteService;
    private final UserService userService;

    public InviteController(ServerInviteService inviteService, UserService userService) {
        this.inviteService = inviteService;
        this.userService = userService;
    }

    @GetMapping("/{code}")
    public ResponseEntity<?> getInviteInfo(@PathVariable String code) {
        try {
            // This would need to be implemented to get invite info without using it
            return ResponseEntity.ok(Map.of("code", code));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{code}/use")
    public ResponseEntity<?> useInvite(@PathVariable String code, Principal principal) {
        User user = userService.findByUsername(principal.getName()).orElseThrow();

        try {
            ServerInvite invite = inviteService.useInvite(code, user);
            return ResponseEntity.ok(Map.of(
                    "message", "Successfully joined server",
                    "serverId", invite.getServer().getId(),
                    "serverName", invite.getServer().getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
