package vn.cococord.service;

import vn.cococord.dto.response.UserSessionResponse;
import vn.cococord.entity.mysql.User;

import java.util.List;

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
}
