package vn.cococord.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import vn.cococord.dto.request.SetUserNoteRequest;
import vn.cococord.dto.request.UpdateUserSettingsRequest;
import vn.cococord.dto.response.ServerResponse;
import vn.cococord.dto.response.UserProfileResponse;
import vn.cococord.dto.response.UserSessionResponse;
import vn.cococord.entity.mysql.User;

public interface IUserService {

    /**
     * Get all active sessions for current user
     */
    List<UserSessionResponse> getUserSessions(String username, String currentRefreshToken);

    /**
     * Revoke a specific session
     */
    void revokeSession(String username, Long sessionId);

    /**
     * Get user by username
     */
    User getUserByUsername(String username);

    /**
     * Get user by id
     */
    User getUserById(Long userId);

    /**
     * Get user profile by username
     */
    UserProfileResponse getUserProfileByUsername(String username);

    /**
     * Get user profile by ID (includes note if viewer is specified)
     */
    UserProfileResponse getUserProfileById(Long userId, String viewerUsername);

    /**
     * Search users by username/email (excluding current user)
     */
    List<UserProfileResponse> searchUsers(String query, String currentUsername);

    /**
     * Update user profile settings
     */
    UserProfileResponse updateUserSettings(UpdateUserSettingsRequest request, String username);

    /**
     * Upload user avatar
     */
    String uploadAvatar(MultipartFile file, String username);

    /**
     * Upload user banner
     */
    String uploadBanner(MultipartFile file, String username);

    /**
     * Set private note about another user
     */
    void setUserNote(Long targetUserId, SetUserNoteRequest request, String username);

    /**
     * Get mutual servers with another user
     */
    List<ServerResponse> getMutualServers(Long targetUserId, String username);
}
