package vn.cococord.controller.user;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.cococord.dto.request.*;
import vn.cococord.dto.response.AuthResponse;
import vn.cococord.dto.response.MessageResponse;
import vn.cococord.dto.response.UserSessionResponse;
import vn.cococord.service.IAuthService;
import vn.cococord.service.IUserService;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final IAuthService authService;
    private final IUserService userService;

    /**
     * 1.1 Login endpoint
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        AuthResponse response = authService.login(request, httpRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * 1.2 Register endpoint
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request) {
        MessageResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 1.3 Refresh token endpoint
     * POST /api/auth/refresh
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 1.4 Change password endpoint (requires authentication)
     * POST /api/auth/change-password
     */
    @PostMapping("/change-password")
    public ResponseEntity<MessageResponse> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        MessageResponse response = authService.changePassword(request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * 1.5 Forgot password endpoint
     * POST /api/auth/forgot-password
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        MessageResponse response = authService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 1.5 Reset password endpoint
     * POST /api/auth/reset-password
     */
    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        MessageResponse response = authService.resetPassword(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 1.6 Logout endpoint (single device)
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(
            @Valid @RequestBody RefreshTokenRequest request) {

        MessageResponse response = authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(response);
    }

    /**
     * 1.6 Logout all devices endpoint
     * POST /api/auth/logout-all
     */
    @PostMapping("/logout-all")
    public ResponseEntity<MessageResponse> logoutAll(@AuthenticationPrincipal UserDetails userDetails) {
        authService.logoutAll(userDetails.getUsername());
        return ResponseEntity.ok(MessageResponse.success("Logged out from all devices."));
    }

    /**
     * 1.6 Get all active sessions
     * GET /api/auth/sessions
     */
    @GetMapping("/sessions")
    public ResponseEntity<List<UserSessionResponse>> getSessions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestHeader("Authorization") String authHeader) {

        // Extract refresh token from custom header (you can also use a separate
        // endpoint parameter)
        String refreshToken = authHeader.replace("Bearer ", "");

        List<UserSessionResponse> sessions = userService.getUserSessions(
                userDetails.getUsername(),
                refreshToken);

        return ResponseEntity.ok(sessions);
    }

    /**
     * 1.6 Revoke specific session
     * DELETE /api/auth/sessions/{sessionId}
     */
    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<MessageResponse> revokeSession(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {

        userService.revokeSession(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(MessageResponse.success("Session revoked successfully."));
    }

    /**
     * Get current user info
     * GET /api/auth/me
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        var user = userService.getUserByUsername(userDetails.getUsername());

        var response = new java.util.HashMap<String, Object>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("displayName", user.getDisplayName());
        response.put("avatarUrl", user.getAvatarUrl());
        response.put("status", user.getStatus());
        response.put("createdAt", user.getCreatedAt());
        response.put("lastLogin", user.getLastLogin());

        return ResponseEntity.ok(response);
    }
}
