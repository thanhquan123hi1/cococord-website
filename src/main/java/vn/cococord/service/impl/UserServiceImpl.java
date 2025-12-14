package vn.cococord.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import vn.cococord.dto.response.UserSessionResponse;
import vn.cococord.dto.response.UserProfileResponse;
import vn.cococord.entity.mysql.User;
import vn.cococord.entity.mysql.UserSession;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.repository.IUserRepository;
import vn.cococord.repository.IUserSessionRepository;
import vn.cococord.service.IUserService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements IUserService {

        private final IUserRepository userRepository;
        private final IUserSessionRepository userSessionRepository;

        /**
         * 1.6 Get all active sessions for current user
         */
        @Transactional(readOnly = true)
        public List<UserSessionResponse> getUserSessions(String username, String currentRefreshToken) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                List<UserSession> sessions = userSessionRepository.findByUserIdAndIsActiveTrue(user.getId());

                return sessions.stream()
                                .map(session -> UserSessionResponse.builder()
                                                .id(session.getId())
                                                .deviceInfo(session.getDeviceInfo())
                                                .ipAddress(session.getIpAddress())
                                                .isActive(session.getIsActive())
                                                .createdAt(session.getCreatedAt())
                                                .expiresAt(session.getExpiresAt())
                                                .isCurrent(session.getRefreshToken().equals(currentRefreshToken))
                                                .build())
                                .collect(Collectors.toList());
        }

        /**
         * Revoke a specific session
         */
        @Transactional
        @SuppressWarnings("null")
        public void revokeSession(String username, Long sessionId) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                UserSession session = userSessionRepository.findById(sessionId)
                                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

                // Verify the session belongs to the user
                if (!session.getUser().getId().equals(user.getId())) {
                        throw new ResourceNotFoundException("Session not found");
                }

                session.setIsActive(false);
                userSessionRepository.save(session);
        }

        /**
         * Get user by username
         */
        @Transactional(readOnly = true)
        public User getUserByUsername(String username) {
                return userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }

        /**
         * Get user by id
         */
        @Transactional(readOnly = true)
        @SuppressWarnings("null")
        public User getUserById(Long userId) {
                return userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }

        @Override
        @Transactional(readOnly = true)
        public UserProfileResponse getUserProfileByUsername(String username) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
                return convertToUserProfile(user);
        }

        @Override
        @Transactional(readOnly = true)
        public List<UserProfileResponse> searchUsers(String query, String currentUsername) {
                String q = query == null ? "" : query.trim();
                if (q.isEmpty()) {
                        return List.of();
                }

                return userRepository
                                .findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(q, q,
                                                PageRequest.of(0, 10))
                                .stream()
                                .filter(u -> u.getUsername() != null
                                                && !u.getUsername().equalsIgnoreCase(currentUsername))
                                .map(this::convertToUserProfile)
                                .collect(Collectors.toList());
        }

        private UserProfileResponse convertToUserProfile(User user) {
                return UserProfileResponse.builder()
                                .id(user.getId())
                                .username(user.getUsername())
                                .displayName(user.getDisplayName())
                                .email(user.getEmail())
                                .avatarUrl(user.getAvatarUrl())
                                .bio(user.getBio())
                                .customStatus(user.getCustomStatus())
                                .status(user.getStatus() != null ? user.getStatus().name() : "OFFLINE")
                                .isActive(user.getIsActive())
                                .isBanned(user.getIsBanned())
                                .isEmailVerified(user.getIsEmailVerified())
                                .twoFactorEnabled(user.getTwoFactorEnabled())
                                .lastLogin(user.getLastLogin())
                                .createdAt(user.getCreatedAt())
                                .build();
        }
}
