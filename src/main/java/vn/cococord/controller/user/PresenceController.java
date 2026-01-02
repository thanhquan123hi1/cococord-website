package vn.cococord.controller.user;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import vn.cococord.service.IPresenceService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/presence")
public class PresenceController {

    private final IPresenceService presenceService;

    /**
     * Snapshot presence for a set of users.
     * Example: GET /api/presence/users?ids=1,2,3
     */
    @GetMapping("/users")
    public Map<Long, String> getUsersPresence(@RequestParam(name = "ids", required = false) List<Long> ids) {
        if (ids == null || ids.isEmpty())
            return Collections.emptyMap();
        return presenceService.getUsersPresence(ids);
    }
}
