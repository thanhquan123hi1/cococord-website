package vn.cococord.controller.user;

import java.time.Instant;
import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import vn.cococord.service.IPresenceService;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserHeartbeatController {

    private final IPresenceService presenceService;

    @PostMapping("/heartbeat")
    public Map<String, Object> heartbeat(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails != null) {
            presenceService.updateLastActivity(userDetails.getUsername());
        }
        return Map.of(
                "status", "ok",
                "ts", Instant.now().toEpochMilli());
    }
}
