package vn.cococord.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.cococord.dto.request.UpdateStatusRequest;
import vn.cococord.dto.websocket.WebSocketEvent;
import vn.cococord.entity.mysql.Server;
import vn.cococord.entity.mysql.ServerMember;
import vn.cococord.entity.mysql.User;
import vn.cococord.entity.mysql.User.UserStatus;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.repository.IServerMemberRepository;
import vn.cococord.repository.IUserRepository;
import vn.cococord.service.IFriendService;
import vn.cococord.service.IPresenceService;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PresenceServiceImpl implements IPresenceService {

    private final IUserRepository userRepository;
    private final IServerMemberRepository serverMemberRepository;
    private final IFriendService friendService;
    private final SimpMessagingTemplate messagingTemplate;

    // In-memory store for active connections (userId -> Set of sessionIds)
    private final Map<Long, Set<String>> activeConnections = new ConcurrentHashMap<>();
    
    // Track last activity time (userId -> timestamp)
    private final Map<Long, LocalDateTime> lastActivity = new ConcurrentHashMap<>();

    @Override
    public void updateStatus(UpdateStatusRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String oldStatus = user.getStatus().name();
        
        // Update status
        UserStatus newStatus = UserStatus.valueOf(request.getStatus());
        user.setStatus(newStatus);
        
        // Update custom status
        if (request.getCustomStatus() != null) {
            user.setCustomStatus(request.getCustomStatus());
            user.setCustomStatusEmoji(request.getCustomStatusEmoji());
            
            // Calculate expiry time
            if (request.getCustomStatusDuration() != null && request.getCustomStatusDuration() > 0) {
                user.setCustomStatusExpiresAt(
                    LocalDateTime.now().plusMinutes(request.getCustomStatusDuration())
                );
            } else {
                user.setCustomStatusExpiresAt(null); // Don't clear
            }
        }
        
        userRepository.save(user);
        
        // Update last activity
        lastActivity.put(user.getId(), LocalDateTime.now());
        
        // Broadcast status change
        broadcastStatusChange(user, oldStatus, newStatus.name());
        
        log.info("User {} status updated from {} to {}", username, oldStatus, newStatus);
    }

    @Override
    public void trackUserConnection(String username, String sessionId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        activeConnections.computeIfAbsent(user.getId(), k -> ConcurrentHashMap.newKeySet())
                .add(sessionId);
        
        lastActivity.put(user.getId(), LocalDateTime.now());
        
        // Auto-set to ONLINE if not INVISIBLE
        if (user.getStatus() != UserStatus.INVISIBLE) {
            String oldStatus = user.getStatus().name();
            user.setStatus(UserStatus.ONLINE);
            userRepository.save(user);
            
            if (!oldStatus.equals("ONLINE")) {
                broadcastStatusChange(user, oldStatus, "ONLINE");
            }
        }
        
        log.info("User {} connected with session {}", username, sessionId);
    }

    @Override
    public void removeUserConnection(String username, String sessionId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Set<String> sessions = activeConnections.get(user.getId());
        if (sessions != null) {
            sessions.remove(sessionId);
            
            // If no more active sessions, set to OFFLINE
            if (sessions.isEmpty()) {
                activeConnections.remove(user.getId());
                lastActivity.remove(user.getId());
                
                if (user.getStatus() != UserStatus.INVISIBLE) {
                    String oldStatus = user.getStatus().name();
                    user.setStatus(UserStatus.OFFLINE);
                    userRepository.save(user);
                    broadcastStatusChange(user, oldStatus, "OFFLINE");
                }
            }
        }
        
        log.info("User {} disconnected session {}", username, sessionId);
    }

    @Override
    public String getUserStatus(String username) {
        return userRepository.findByUsername(username)
                .map(user -> user.getStatus().name())
                .orElse("OFFLINE");
    }

    @Override
    public List<Long> getOnlineUsersInServer(Long serverId) {
        List<ServerMember> members = serverMemberRepository.findByServerId(serverId);
        return members.stream()
                .map(ServerMember::getUser)
                .filter(user -> activeConnections.containsKey(user.getId()))
                .filter(user -> user.getStatus() != UserStatus.INVISIBLE)
                .map(User::getId)
                .collect(Collectors.toList());
    }

    @Override
    public void markUserAsIdle(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        if (user.getStatus() == UserStatus.ONLINE) {
            String oldStatus = "ONLINE";
            user.setStatus(UserStatus.IDLE);
            userRepository.save(user);
            broadcastStatusChange(user, oldStatus, "IDLE");
            
            log.info("User {} marked as IDLE", username);
        }
    }

    @Override
    public void broadcastStatusChange(User user, String oldStatus, String newStatus) {
        // Create status change event
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("userId", user.getId());
        eventData.put("username", user.getUsername());
        eventData.put("oldStatus", oldStatus);
        eventData.put("newStatus", newStatus);
        eventData.put("customStatus", user.getCustomStatus());
        eventData.put("customStatusEmoji", user.getCustomStatusEmoji());
        eventData.put("timestamp", LocalDateTime.now());

        WebSocketEvent event = new WebSocketEvent("user.status.changed", eventData);

        // Broadcast to user's friends
        try {
            var friends = friendService.getFriends(user.getUsername());
            for (var friend : friends) {
                messagingTemplate.convertAndSendToUser(
                    String.valueOf(friend.getId()),
                    "/queue/presence",
                    event
                );
            }
        } catch (Exception e) {
            log.error("Failed to broadcast to friends: {}", e.getMessage());
        }

        // Broadcast to servers where user is a member
        try {
            List<ServerMember> memberships = serverMemberRepository.findByUserId(user.getId());
            for (ServerMember membership : memberships) {
                Server server = membership.getServer();
                messagingTemplate.convertAndSend(
                    "/topic/server." + server.getId() + ".presence",
                    event
                );
            }
        } catch (Exception e) {
            log.error("Failed to broadcast to servers: {}", e.getMessage());
        }
    }

    @Override
    public Map<Long, String> getUsersPresence(List<Long> userIds) {
        List<User> users = userRepository.findAllById(userIds);
        return users.stream()
                .collect(Collectors.toMap(
                    User::getId,
                    user -> user.getStatus().name()
                ));
    }

    /**
     * Auto-idle detection: Check every minute for inactive users
     */
    @Scheduled(fixedRate = 60000) // Run every minute
    public void autoIdleDetection() {
        LocalDateTime idleThreshold = LocalDateTime.now().minusMinutes(10);
        
        List<Long> idleUserIds = lastActivity.entrySet().stream()
                .filter(entry -> entry.getValue().isBefore(idleThreshold))
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        
        for (Long userId : idleUserIds) {
            userRepository.findById(userId).ifPresent(user -> {
                if (user.getStatus() == UserStatus.ONLINE) {
                    user.setStatus(UserStatus.IDLE);
                    userRepository.save(user);
                    broadcastStatusChange(user, "ONLINE", "IDLE");
                    log.info("Auto-marked user {} as IDLE", user.getUsername());
                }
            });
        }
    }

    /**
     * Clear expired custom statuses: Check every 5 minutes
     */
    @Override
    @Scheduled(fixedRate = 300000) // Run every 5 minutes
    public void clearExpiredCustomStatuses() {
        LocalDateTime now = LocalDateTime.now();
        List<User> usersWithExpiredStatus = userRepository.findAll().stream()
                .filter(user -> user.getCustomStatusExpiresAt() != null)
                .filter(user -> user.getCustomStatusExpiresAt().isBefore(now))
                .collect(Collectors.toList());
        
        for (User user : usersWithExpiredStatus) {
            user.setCustomStatus(null);
            user.setCustomStatusEmoji(null);
            user.setCustomStatusExpiresAt(null);
            userRepository.save(user);
            
            // Broadcast custom status cleared
            broadcastStatusChange(user, user.getStatus().name(), user.getStatus().name());
            log.info("Cleared expired custom status for user {}", user.getUsername());
        }
    }

    /**
     * Update last activity timestamp (called on user actions)
     */
    public void updateLastActivity(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            lastActivity.put(user.getId(), LocalDateTime.now());
            
            // If user was IDLE, set back to ONLINE
            if (user.getStatus() == UserStatus.IDLE) {
                user.setStatus(UserStatus.ONLINE);
                userRepository.save(user);
                broadcastStatusChange(user, "IDLE", "ONLINE");
            }
        });
    }
}
