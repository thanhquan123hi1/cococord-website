package vn.cococord.service.impl;

import java.util.HashMap;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.response.ServerResponse;
import vn.cococord.dto.response.UserProfileResponse;
import vn.cococord.entity.mysql.Server;
import vn.cococord.entity.mysql.User;
import vn.cococord.entity.mysql.User.Role;
import vn.cococord.entity.mysql.User.UserStatus;
import vn.cococord.exception.BadRequestException;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.repository.IServerRepository;
import vn.cococord.repository.IUserRepository;
import vn.cococord.service.IAdminService;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
@SuppressWarnings("null")
public class AdminServiceImpl implements IAdminService {

    private final IUserRepository userRepository;
    private final IServerRepository serverRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<UserProfileResponse> getAllUsers(Pageable pageable, String search) {
        Page<User> users;
        if (search != null && !search.trim().isEmpty()) {
            @SuppressWarnings("null")
            Page<User> result = userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                    search, search, pageable);
            users = result;
        } else {
            @SuppressWarnings("null")
            Page<User> result = userRepository.findAll(pageable);
            users = result;
        }
        return users.map(this::mapUserToResponse);
    }

    @Override
    public void banUser(Long userId, String adminUsername) {
        User admin = getUserByUsername(adminUsername);
        User user = getUserById(userId);

        if (user.getId().equals(admin.getId())) {
            throw new BadRequestException("You cannot ban yourself");
        }

        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("You cannot ban another admin");
        }

        user.setIsBanned(true);
        userRepository.save(user);
        log.info("Admin {} banned user {}", adminUsername, user.getUsername());
    }

    @Override
    public void unbanUser(Long userId, String adminUsername) {
        User user = getUserById(userId);
        user.setIsBanned(false);
        userRepository.save(user);
        log.info("Admin {} unbanned user {}", adminUsername, user.getUsername());
    }

    @Override
    public void updateUserRole(Long userId, String role, String adminUsername) {
        User admin = getUserByUsername(adminUsername);
        User user = getUserById(userId);

        if (user.getId().equals(admin.getId())) {
            throw new BadRequestException("You cannot change your own role");
        }

        try {
            Role newRole = Role.valueOf(role.toUpperCase());
            user.setRole(newRole);
            userRepository.save(user);
            log.info("Admin {} changed role of user {} to {}", adminUsername, user.getUsername(), newRole);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + role);
        }
    }

    @Override
    public void deleteUser(Long userId, String adminUsername) {
        User admin = getUserByUsername(adminUsername);
        User user = getUserById(userId);

        if (user.getId().equals(admin.getId())) {
            throw new BadRequestException("You cannot delete yourself");
        }

        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("You cannot delete another admin");
        }

        userRepository.delete(user);
        log.info("Admin {} deleted user {}", adminUsername, user.getUsername());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ServerResponse> getAllServers(Pageable pageable, String search) {
        Page<Server> servers;
        if (search != null && !search.trim().isEmpty()) {
            @SuppressWarnings("null")
            Page<Server> result = serverRepository.findByNameContainingIgnoreCase(search, pageable);
            servers = result;
        } else {
            @SuppressWarnings("null")
            Page<Server> result = serverRepository.findAll(pageable);
            servers = result;
        }
        return servers.map(this::mapServerToResponse);
    }

    @Override
    public void deleteServer(Long serverId, String adminUsername) {
        @SuppressWarnings("null")
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found"));

        @SuppressWarnings("null")
        Server toDelete = server;
        serverRepository.delete(toDelete);
        log.info("Admin {} deleted server {}", adminUsername, server.getName());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalServers", serverRepository.count());
        stats.put("bannedUsers", userRepository.countByIsBannedTrue());
        stats.put("onlineUsers", getOnlineUserCount());
        stats.put("activeUsers", userRepository.countByIsActiveTrue());
        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public long getOnlineUserCount() {
        return userRepository.countByStatus(UserStatus.ONLINE);
    }

    // ================== Private Methods ==================

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private User getUserById(Long userId) {
        @SuppressWarnings("null")
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return user;
    }

    private UserProfileResponse mapUserToResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .customStatus(user.getCustomStatus())
                .isActive(user.getIsActive())
                .isBanned(user.getIsBanned())
                .createdAt(user.getCreatedAt())
                .lastLogin(user.getLastLogin())
                .build();
    }

    private ServerResponse mapServerToResponse(Server server) {
        return ServerResponse.builder()
                .id(server.getId())
                .name(server.getName())
                .description(server.getDescription())
                .iconUrl(server.getIconUrl())
                .bannerUrl(server.getBannerUrl())
                .ownerId(server.getOwner().getId())
                .ownerUsername(server.getOwner().getUsername())
                .memberCount(server.getMembers() != null ? server.getMembers().size() : 0)
                .createdAt(server.getCreatedAt())
                .build();
    }
}
