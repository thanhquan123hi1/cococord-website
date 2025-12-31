package vn.cococord.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import vn.cococord.dto.request.SetUserNoteRequest;
import vn.cococord.dto.request.UpdateUserSettingsRequest;
import vn.cococord.dto.response.ServerResponse;
import vn.cococord.dto.response.UserProfileResponse;
import vn.cococord.dto.response.UserSessionResponse;
import vn.cococord.entity.mysql.Server;
import vn.cococord.entity.mysql.ServerMember;
import vn.cococord.entity.mysql.User;
import vn.cococord.entity.mysql.UserNote;
import vn.cococord.entity.mysql.UserSession;
import vn.cococord.exception.BadRequestException;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.repository.IServerMemberRepository;
import vn.cococord.repository.IUserNoteRepository;
import vn.cococord.repository.IUserRepository;
import vn.cococord.repository.IUserSessionRepository;
import vn.cococord.service.IFileStorageService;
import vn.cococord.service.IUserService;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class UserServiceImpl implements IUserService {

        private final IUserRepository userRepository;
        private final IUserSessionRepository userSessionRepository;
        private final IUserNoteRepository userNoteRepository;
        private final IServerMemberRepository serverMemberRepository;
        private final IFileStorageService fileStorageService;

        /**
         * 1.6 Get all active sessions for current user
         */
        @Override
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
        @Override
        @Transactional
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
        @Override
        @Transactional(readOnly = true)
        public User getUserByUsername(String username) {
                return userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }

        /**
         * Get user by id
         */
        @Override
        @Transactional(readOnly = true)
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
                return convertToUserProfile(user, null);
        }

        private UserProfileResponse convertToUserProfile(User user, String viewerUsername) {
                UserProfileResponse.UserProfileResponseBuilder builder = UserProfileResponse.builder()
                                .id(user.getId())
                                .username(user.getUsername())
                                .displayName(user.getDisplayName())
                                .discriminator(String.format("%04d", user.getId() % 10000))
                                .email(user.getEmail())
                                .avatarUrl(user.getAvatarUrl())
                                .bannerUrl(user.getBannerUrl())
                                .bio(user.getBio())
                                .pronouns(user.getPronouns())
                                .customStatus(user.getCustomStatus())
                                .customStatusEmoji(user.getCustomStatusEmoji())
                                .customStatusExpiresAt(user.getCustomStatusExpiresAt())
                                .status(user.getStatus() != null ? user.getStatus().name() : "OFFLINE")
                                .theme(user.getTheme())
                                .messageDisplay(user.getMessageDisplay())
                                .isActive(user.getIsActive())
                                .isBanned(user.getIsBanned())
                                .isEmailVerified(user.getIsEmailVerified())
                                .twoFactorEnabled(user.getTwoFactorEnabled())
                                .allowFriendRequests(user.getAllowFriendRequests())
                                .allowDirectMessages(user.getAllowDirectMessages())
                                .lastLogin(user.getLastLogin())
                                .createdAt(user.getCreatedAt());

                // Add private note if viewer is specified
                if (viewerUsername != null) {
                        User viewer = userRepository.findByUsername(viewerUsername).orElse(null);
                        if (viewer != null) {
                                userNoteRepository.findByOwnerAndTargetUser(viewer, user)
                                                .ifPresent(note -> builder.note(note.getNote()));
                        }
                }

                return builder.build();
        }

        @Override
        @Transactional(readOnly = true)
        public UserProfileResponse getUserProfileById(Long userId, String viewerUsername) {
                User user = getUserById(userId);
                return convertToUserProfile(user, viewerUsername);
        }

        @Override
        @Transactional
        public UserProfileResponse updateUserSettings(UpdateUserSettingsRequest request, String username) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                // Update fields if provided
                if (request.getUsername() != null && !request.getUsername().equals(username)) {
                        // Check if new username is already taken
                        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
                                throw new BadRequestException("Username already taken");
                        }
                        user.setUsername(request.getUsername());
                }

                if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
                        // Check if new email is already taken
                        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                                throw new BadRequestException("Email already in use");
                        }
                        user.setEmail(request.getEmail());
                        user.setIsEmailVerified(false); // Require re-verification
                }

                if (request.getDisplayName() != null) {
                        user.setDisplayName(request.getDisplayName());
                }

                if (request.getBio() != null) {
                        user.setBio(request.getBio());
                }

                if (request.getPronouns() != null) {
                        user.setPronouns(request.getPronouns());
                }

                if (request.getTheme() != null) {
                        user.setTheme(request.getTheme());
                }

                if (request.getMessageDisplay() != null) {
                        user.setMessageDisplay(request.getMessageDisplay());
                }

                if (request.getAllowFriendRequests() != null) {
                        user.setAllowFriendRequests(request.getAllowFriendRequests());
                }

                if (request.getAllowDirectMessages() != null) {
                        user.setAllowDirectMessages(request.getAllowDirectMessages());
                }

                userRepository.save(user);
                return convertToUserProfile(user);
        }

        @Override
        @Transactional
        public String uploadAvatar(MultipartFile file, String username) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                // Validate file
                fileStorageService.validateFile(file);

                // Upload file
                var uploadResponse = fileStorageService.uploadFile(file, username);

                // Update user avatar URL
                user.setAvatarUrl(uploadResponse.getFileUrl());
                userRepository.save(user);

                return uploadResponse.getFileUrl();
        }

        @Override
        @Transactional
        public String uploadBanner(MultipartFile file, String username) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                // Validate file
                fileStorageService.validateFile(file);

                // Upload file
                var uploadResponse = fileStorageService.uploadFile(file, username);

                // Update user banner URL
                user.setBannerUrl(uploadResponse.getFileUrl());
                userRepository.save(user);

                return uploadResponse.getFileUrl();
        }

        @Override
        @Transactional
        public void setUserNote(Long targetUserId, SetUserNoteRequest request, String username) {
                User owner = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                User targetUser = getUserById(targetUserId);

                if (owner.getId().equals(targetUser.getId())) {
                        throw new BadRequestException("Cannot set note for yourself");
                }

                UserNote note = userNoteRepository.findByOwnerAndTargetUser(owner, targetUser)
                                .orElse(UserNote.builder()
                                                .owner(owner)
                                                .targetUser(targetUser)
                                                .build());

                if (request.getNote() == null || request.getNote().trim().isEmpty()) {
                        // Delete note if empty
                        if (note.getId() != null) {
                                userNoteRepository.delete(note);
                        }
                } else {
                        note.setNote(request.getNote());
                        userNoteRepository.save(note);
                }
        }

        @Override
        @Transactional(readOnly = true)
        public List<ServerResponse> getMutualServers(Long targetUserId, String username) {
                User currentUser = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                User targetUser = getUserById(targetUserId);

                // Get servers where both users are members
                List<ServerMember> currentUserServers = serverMemberRepository.findByUserId(currentUser.getId());
                List<ServerMember> targetUserServers = serverMemberRepository.findByUserId(targetUser.getId());

                List<Long> currentUserServerIds = currentUserServers.stream()
                                .map(m -> m.getServer().getId())
                                .collect(Collectors.toList());

                return targetUserServers.stream()
                                .filter(m -> currentUserServerIds.contains(m.getServer().getId()))
                                .map(m -> {
                                        Server server = m.getServer();
                                        return ServerResponse.builder()
                                                        .id(server.getId())
                                                        .name(server.getName())
                                                        .iconUrl(server.getIconUrl())
                                                        .build();
                                })
                                .collect(Collectors.toList());
        }
}
