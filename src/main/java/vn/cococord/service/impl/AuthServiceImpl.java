package vn.cococord.service.impl;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.request.ChangePasswordRequest;
import vn.cococord.dto.request.ForgotPasswordRequest;
import vn.cococord.dto.request.LoginRequest;
import vn.cococord.dto.request.RefreshTokenRequest;
import vn.cococord.dto.request.RegisterRequest;
import vn.cococord.dto.request.ResetPasswordRequest;
import vn.cococord.dto.response.AuthResponse;
import vn.cococord.dto.response.MessageResponse;
import vn.cococord.entity.mysql.User;
import vn.cococord.entity.mysql.UserSession;
import vn.cococord.exception.BadRequestException;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.exception.UnauthorizedException;
import vn.cococord.repository.IUserRepository;
import vn.cococord.repository.IUserSessionRepository;
import vn.cococord.security.JwtTokenProvider;
import vn.cococord.service.IAuthService;
import vn.cococord.service.IEmailService;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements IAuthService {

    private final AuthenticationManager authenticationManager;
    private final IUserRepository userRepository;
    private final IUserSessionRepository userSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final IEmailService emailService;

    /**
     * 1.1 Login - Xác thực và tạo JWT tokens
     */
    @Override
    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        // Authenticate user
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsernameOrEmail(),
                        request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Get user info
        User user = userRepository.findByUsernameOrEmail(request.getUsernameOrEmail(), request.getUsernameOrEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Generate tokens
        String accessToken = jwtTokenProvider.generateAccessToken(authentication);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());

        // Save refresh token to database
        createUserSession(user, refreshToken, request.getDeviceInfo(), httpRequest);

        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        log.info("User {} logged in successfully from {}", user.getUsername(), getClientIP(httpRequest));

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs())
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .loginAt(LocalDateTime.now())
                .build();
    }

    /**
     * 1.2 Register - Đăng ký tài khoản mới
     */
    @Override
    @Transactional
    @SuppressWarnings("null")
    public MessageResponse register(RegisterRequest request) {
        // Check if username exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Tên đăng nhập đã tồn tại");
        }

        // Check if email exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã được đăng ký");
        }

        // Create new user
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .build();

        userRepository.save(user);

        log.info("New user registered: {}", user.getUsername());

        // Optional: Send welcome email
        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getDisplayName());
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}", user.getEmail(), e);
        }

        return MessageResponse.success("Đăng ký thành công! Bạn có thể đăng nhập ngay.");
    }

    /**
     * 1.3 Refresh Token - Gia hạn access token
     */
    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        // Validate refresh token
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        // Find session in database
        UserSession userSession = userSessionRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new UnauthorizedException("Refresh token not found"));

        // Check if session is active
        if (!userSession.getIsActive()) {
            throw new UnauthorizedException("Session has been revoked");
        }

        // Check if session is expired
        if (userSession.getExpiresAt().isBefore(LocalDateTime.now())) {
            userSession.setIsActive(false);
            userSessionRepository.save(userSession);
            throw new UnauthorizedException("Refresh token has expired");
        }

        // Get username from token
        String username = jwtTokenProvider.getUsernameFromToken(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Generate new access token
        String newAccessToken = jwtTokenProvider.generateAccessToken(username);

        log.info("Access token refreshed for user: {}", username);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs())
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .build();
    }

    /**
     * 1.4 Change Password - Đổi mật khẩu (yêu cầu xác thực)
     */
    @Override
    @Transactional
    public MessageResponse changePassword(ChangePasswordRequest request, String username) {
        // Validate new password matches confirm
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }

        // Get user
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        // Check if new password is same as current
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("New password must be different from current password");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Revoke all other sessions for security
        userSessionRepository.deactivateAllUserSessions(user.getId());

        log.info("Password changed for user: {}", username);

        // Send email notification
        try {
            emailService.sendPasswordChangedEmail(user.getEmail(), user.getDisplayName());
        } catch (Exception e) {
            log.error("Failed to send password changed email", e);
        }

        return MessageResponse.success("Password changed successfully. Please login again.");
    }

    /**
     * 1.5 Forgot Password - Gửi email reset password
     */
    @Override
    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No account found with this email"));

        // Generate reset token
        String resetToken = UUID.randomUUID().toString();
        user.setResetPasswordToken(resetToken);
        user.setResetPasswordExpiry(LocalDateTime.now().plusHours(1)); // Token valid for 1 hour
        userRepository.save(user);

        log.info("Password reset requested for user: {}", user.getUsername());

        // Send reset email
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), user.getDisplayName(), resetToken);
        } catch (Exception e) {
            log.error("Failed to send password reset email", e);
            throw new BadRequestException("Failed to send reset email. Please try again later.");
        }

        return MessageResponse.success("Password reset link has been sent to your email");
    }

    /**
     * 1.5 Reset Password - Reset mật khẩu bằng token
     */
    @Override
    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        // Validate passwords match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        // Find user by reset token
        User user = userRepository.findByResetPasswordToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid reset token"));

        // Check if token is expired
        if (user.getResetPasswordExpiry() == null ||
                user.getResetPasswordExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Reset token has expired");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordExpiry(null);
        userRepository.save(user);

        // Revoke all sessions
        userSessionRepository.deactivateAllUserSessions(user.getId());

        log.info("Password reset successful for user: {}", user.getUsername());

        // Send confirmation email
        try {
            emailService.sendPasswordResetSuccessEmail(user.getEmail(), user.getDisplayName());
        } catch (Exception e) {
            log.error("Failed to send password reset success email", e);
        }

        return MessageResponse.success("Password has been reset successfully. You can now login.");
    }

    /**
     * Logout - Revoke refresh token
     */
    @Override
    @Transactional
    public MessageResponse logout(String refreshToken) {
        UserSession session = userSessionRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        session.setIsActive(false);
        userSessionRepository.save(session);

        log.info("User {} logged out", session.getUser().getUsername());

        return MessageResponse.success("Logged out successfully");
    }

    /**
     * Logout from all devices
     */
    @Override
    @Transactional
    public MessageResponse logoutAll(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        userSessionRepository.deactivateAllUserSessions(user.getId());

        log.info("User {} logged out from all devices", username);

        return MessageResponse.success("Logged out from all devices successfully");
    }

    /**
     * Helper: Create user session
     */
    @SuppressWarnings("null")
    private UserSession createUserSession(User user, String refreshToken, String deviceInfo,
            HttpServletRequest request) {
        long expirationMs = jwtTokenProvider.getRefreshTokenExpirationMs();
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(expirationMs / 1000);

        UserSession session = UserSession.builder()
                .user(user)
                .refreshToken(refreshToken)
                .deviceInfo(deviceInfo != null ? deviceInfo : "Unknown Device")
                .ipAddress(getClientIP(request))
                .expiresAt(expiresAt)
                .build();

        return userSessionRepository.save(session);
    }

    /**
     * Helper: Get client IP address
     */
    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
