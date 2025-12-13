package vn.cococord.service;

import jakarta.servlet.http.HttpServletRequest;
import vn.cococord.dto.request.*;
import vn.cococord.dto.response.AuthResponse;
import vn.cococord.dto.response.MessageResponse;

public interface IAuthService {

    /**
     * Login - Xác thực và tạo JWT tokens
     */
    AuthResponse login(LoginRequest request, HttpServletRequest httpRequest);

    /**
     * Register - Đăng ký tài khoản mới
     */
    MessageResponse register(RegisterRequest request);

    /**
     * Refresh token - Làm mới access token
     */
    AuthResponse refreshToken(RefreshTokenRequest request);

    /**
     * Change password - Đổi mật khẩu (yêu cầu xác thực)
     */
    MessageResponse changePassword(ChangePasswordRequest request, String username);

    /**
     * Forgot password - Yêu cầu reset mật khẩu
     */
    MessageResponse forgotPassword(ForgotPasswordRequest request);

    /**
     * Reset password - Reset mật khẩu với token
     */
    MessageResponse resetPassword(ResetPasswordRequest request);

    /**
     * Logout - Đăng xuất khỏi 1 device
     */
    MessageResponse logout(String refreshToken);

    /**
     * Logout all - Đăng xuất khỏi tất cả devices
     */
    MessageResponse logoutAll(String username);
}
