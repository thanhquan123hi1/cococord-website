package vn.cococord.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
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
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Presence Service with automatic Redis/In-Memory fallback.
 * 
 * When Redis is available (spring.data.redis.enabled=true):
 * - Uses Redis for distributed session tracking
 * - Supports multi-instance deployments
 * - TTL-based auto-expiry
 * 
 * When Redis is NOT available:
 * - Falls back to ConcurrentHashMap (single instance only)
 * - Suitable for development and single-server deployments
 */
@Service
@Slf4j
@Transactional
public class PresenceServiceImpl implements IPresenceService {

    private final IUserRepository userRepository;
    private final IServerMemberRepository serverMemberRepository;
    private final IFriendService friendService;
    private final SimpMessagingTemplate messagingTemplate;
    
    // Optional Redis - may be null if Redis is disabled
    private final StringRedisTemplate redisTemplate;
    
    // Fallback in-memory storage when Redis is not available
    private final Map<Long, Set<String>> activeConnections = new ConcurrentHashMap<>();
    private final Map<Long, LocalDateTime> lastActivity = new ConcurrentHashMap<>();
    
    // Redis keys
    private static final String PRESENCE_SESSIONS_PREFIX = "presence:sessions:";
    private static final String PRESENCE_ACTIVITY_PREFIX = "presence:activity:";
    private static final String PRESENCE_ONLINE_SET = "presence:online";
    private static final long PRESENCE_TTL_SECONDS = 300;
    
    @Value("${spring.data.redis.enabled:false}")
    private boolean redisEnabled;

    @Autowired
    public PresenceServiceImpl(
            IUserRepository userRepository,
            IServerMemberRepository serverMemberRepository,
            IFriendService friendService,
            SimpMessagingTemplate messagingTemplate,
            @Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.userRepository = userRepository;
        this.serverMemberRepository = serverMemberRepository;
        this.friendService = friendService;
        this.messagingTemplate = messagingTemplate;
        this.redisTemplate = redisTemplate;
        
        if (redisTemplate != null) {
            log.info("PresenceService initialized with Redis support");
        } else {
            log.info("PresenceService initialized with in-memory fallback (Redis not available)");
        }
    }
    
    private boolean isRedisAvailable() {
        return redisEnabled && redisTemplate != null;
    }

    // ==================== STATUS MANAGEMENT ====================

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
                user.setCustomStatusExpiresAt(null);
            }
        }
        
        userRepository.save(user);
        
        // Update last activity
        updateLastActivityInternal(user.getId());
        
        // Broadcast status change
        broadcastStatusChange(user, oldStatus, newStatus.name());
        
        log.info("User {} status updated from {} to {}", username, oldStatus, newStatus);
    }

    // ==================== CONNECTION TRACKING ====================

    @Override
    public void trackUserConnection(String username, String sessionId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Long userId = user.getId();
        
        if (isRedisAvailable()) {
            trackConnectionRedis(userId, sessionId);
        } else {
            trackConnectionInMemory(userId, sessionId);
        }
        
        // Auto-set to ONLINE if not INVISIBLE
        if (user.getStatus() != UserStatus.INVISIBLE) {
            String oldStatus = user.getStatus().name();
            if (!oldStatus.equals("ONLINE")) {
                user.setStatus(UserStatus.ONLINE);
                userRepository.save(user);
                broadcastStatusChange(user, oldStatus, "ONLINE");
            }
        }
        
        log.info("User {} connected with session {}", username, sessionId);
    }
    
    private void trackConnectionRedis(Long userId, String sessionId) {
        String sessionsKey = PRESENCE_SESSIONS_PREFIX + userId;
        redisTemplate.opsForSet().add(sessionsKey, sessionId);
        redisTemplate.expire(sessionsKey, PRESENCE_TTL_SECONDS, TimeUnit.SECONDS);
        redisTemplate.opsForSet().add(PRESENCE_ONLINE_SET, String.valueOf(userId));
        updateLastActivityInternal(userId);
    }
    
    private void trackConnectionInMemory(Long userId, String sessionId) {
        activeConnections.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(sessionId);
        lastActivity.put(userId, LocalDateTime.now());
    }

    @Override
    public void removeUserConnection(String username, String sessionId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Long userId = user.getId();
        boolean noMoreSessions;
        
        if (isRedisAvailable()) {
            noMoreSessions = removeConnectionRedis(userId, sessionId);
        } else {
            noMoreSessions = removeConnectionInMemory(userId, sessionId);
        }
        
        if (noMoreSessions && user.getStatus() != UserStatus.INVISIBLE) {
            String oldStatus = user.getStatus().name();
            user.setStatus(UserStatus.OFFLINE);
            userRepository.save(user);
            broadcastStatusChange(user, oldStatus, "OFFLINE");
        }
        
        log.info("User {} disconnected session {}", username, sessionId);
    }
    
    private boolean removeConnectionRedis(Long userId, String sessionId) {
        String sessionsKey = PRESENCE_SESSIONS_PREFIX + userId;
        redisTemplate.opsForSet().remove(sessionsKey, sessionId);
        Long remainingSessions = redisTemplate.opsForSet().size(sessionsKey);
        
        if (remainingSessions == null || remainingSessions == 0) {
            redisTemplate.opsForSet().remove(PRESENCE_ONLINE_SET, String.valueOf(userId));
            redisTemplate.delete(PRESENCE_ACTIVITY_PREFIX + userId);
            return true;
        }
        return false;
    }
    
    private boolean removeConnectionInMemory(Long userId, String sessionId) {
        Set<String> sessions = activeConnections.get(userId);
        if (sessions != null) {
            sessions.remove(sessionId);
            if (sessions.isEmpty()) {
                activeConnections.remove(userId);
                lastActivity.remove(userId);
                return true;
            }
        }
        return false;
    }

    // ==================== STATUS QUERIES ====================

    @Override
    public String getUserStatus(String username) {
        return userRepository.findByUsername(username)
                .map(user -> user.getStatus().name())
                .orElse("OFFLINE");
    }

    @Override
    public List<Long> getOnlineUsersInServer(Long serverId) {
        List<ServerMember> members = serverMemberRepository.findByServerId(serverId);
        Set<Long> onlineSet = getOnlineUserIds();
        
        return members.stream()
                .map(ServerMember::getUser)
                .filter(user -> onlineSet.contains(user.getId()))
                .filter(user -> user.getStatus() != UserStatus.INVISIBLE)
                .map(User::getId)
                .collect(Collectors.toList());
    }
    
    private Set<Long> getOnlineUserIds() {
        if (isRedisAvailable()) {
            Set<String> onlineUserIds = redisTemplate.opsForSet().members(PRESENCE_ONLINE_SET);
            if (onlineUserIds != null) {
                return onlineUserIds.stream().map(Long::parseLong).collect(Collectors.toSet());
            }
            return Collections.emptySet();
        } else {
            return new HashSet<>(activeConnections.keySet());
        }
    }

    @Override
    public Map<Long, String> getUsersPresence(List<Long> userIds) {
        Set<Long> onlineSet = getOnlineUserIds();
        List<User> users = userRepository.findAllById(userIds);
        
        return users.stream()
                .collect(Collectors.toMap(
                    User::getId,
                    user -> {
                        if (onlineSet.contains(user.getId()) && user.getStatus() != UserStatus.INVISIBLE) {
                            return user.getStatus().name();
                        }
                        return "OFFLINE";
                    }
                ));
    }

    // ==================== IDLE MANAGEMENT ====================

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
    public void updateLastActivity(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            updateLastActivityInternal(user.getId());
            
            // If user was IDLE, set back to ONLINE
            if (user.getStatus() == UserStatus.IDLE) {
                user.setStatus(UserStatus.ONLINE);
                userRepository.save(user);
                broadcastStatusChange(user, "IDLE", "ONLINE");
            }
        });
    }
    
    private void updateLastActivityInternal(Long userId) {
        if (isRedisAvailable()) {
            String activityKey = PRESENCE_ACTIVITY_PREFIX + userId;
            redisTemplate.opsForValue().set(activityKey, String.valueOf(System.currentTimeMillis()));
            redisTemplate.expire(activityKey, PRESENCE_TTL_SECONDS, TimeUnit.SECONDS);
        } else {
            lastActivity.put(userId, LocalDateTime.now());
        }
    }

    // ==================== SCHEDULED TASKS ====================

    @Scheduled(fixedRate = 60000)
    public void autoIdleDetection() {
        long idleThresholdMillis = System.currentTimeMillis() - (10 * 60 * 1000);
        
        Set<Long> onlineUserIds = getOnlineUserIds();
        
        for (Long userId : onlineUserIds) {
            boolean isIdle;
            
            if (isRedisAvailable()) {
                String activityKey = PRESENCE_ACTIVITY_PREFIX + userId;
                String lastActivityStr = redisTemplate.opsForValue().get(activityKey);
                isIdle = lastActivityStr != null && Long.parseLong(lastActivityStr) < idleThresholdMillis;
            } else {
                LocalDateTime lastActiveTime = lastActivity.get(userId);
                isIdle = lastActiveTime != null && 
                        lastActiveTime.isBefore(LocalDateTime.now().minusMinutes(10));
            }
            
            if (isIdle) {
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
    }

    @Override
    @Scheduled(fixedRate = 300000)
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
            broadcastStatusChange(user, user.getStatus().name(), user.getStatus().name());
            log.info("Cleared expired custom status for user {}", user.getUsername());
        }
    }

    // ==================== BROADCASTING ====================

    @Override
    public void broadcastStatusChange(User user, String oldStatus, String newStatus) {
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
}
