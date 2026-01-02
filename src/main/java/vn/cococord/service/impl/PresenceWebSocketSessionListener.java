package vn.cococord.service.impl;

import java.security.Principal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.context.event.EventListener;
import org.springframework.lang.Nullable;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.service.IPresenceService;

@Component
@RequiredArgsConstructor
@Slf4j
public class PresenceWebSocketSessionListener {

    private final IPresenceService presenceService;

    /**
     * SessionDisconnectEvent may not always carry Principal, so keep a fallback
     * map.
     */
    private final Map<String, String> sessionIdToUsername = new ConcurrentHashMap<>();

    @EventListener
    public void onConnected(SessionConnectedEvent event) {
        if (event == null || event.getMessage() == null)
            return;

        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        Principal principal = accessor.getUser();
        if (sessionId == null || principal == null)
            return;

        String username = principal.getName();
        sessionIdToUsername.put(sessionId, username);

        try {
            presenceService.trackUserConnection(username, sessionId);
        } catch (Exception e) {
            log.warn("[PRESENCE] trackUserConnection failed username={} sessionId={} err={}", username, sessionId,
                    e.getMessage());
        }
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        if (event == null)
            return;

        String sessionId = event.getSessionId();
        String username = usernameFrom(event.getUser(), sessionId);
        if (sessionId == null || username == null)
            return;

        try {
            presenceService.removeUserConnection(username, sessionId);
        } catch (Exception e) {
            log.warn("[PRESENCE] removeUserConnection failed username={} sessionId={} err={}", username, sessionId,
                    e.getMessage());
        } finally {
            sessionIdToUsername.remove(sessionId);
        }
    }

    private @Nullable String usernameFrom(@Nullable Principal principal, @Nullable String sessionId) {
        if (principal != null)
            return principal.getName();
        if (sessionId == null)
            return null;
        return sessionIdToUsername.get(sessionId);
    }
}
