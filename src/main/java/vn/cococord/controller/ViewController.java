package vn.cococord.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controller điều hướng các trang view
 * - Public pages: /, /login, /register, /forgot-password, /reset-password (sử
 * dụng public.jsp decorator)
 * - Authenticated pages: /dashboard, /chat, /friends, etc. (sử dụng app.jsp
 * decorator)
 */
@Controller
public class ViewController {

    @GetMapping("/")
    public String index() {
        return "index"; // Landing page với Header/Footer
    }

    @GetMapping("/login")
    public String login() {
        return "auth/login"; // Login page với Header/Footer
    }

    @GetMapping("/register")
    public String register() {
        return "register"; // Register page với Header/Footer
    }

    @GetMapping("/forgot-password")
    public String forgotPassword() {
        return "forgot-password"; // Forgot password page với Header/Footer
    }

    @GetMapping("/reset-password")
    public String resetPassword() {
        return "reset-password"; // Reset password page với Header/Footer
    }

    @GetMapping("/dashboard")
    public String dashboard() {
        return "redirect:/friends";
    }

    @GetMapping("/chat")
    public String chat() {
        return "chat";
    }

    @GetMapping("/friends")
    public String friends() {
        return "friends";
    }

    @GetMapping("/messages")
    public String messages() {
        return "messages";
    }

    @GetMapping("/profile")
    public String profile() {
        return "profile"; // User profile
    }

    @GetMapping("/sessions")
    public String sessions() {
        return "sessions"; // Active sessions
    }

    @GetMapping("/change-password")
    public String changePassword() {
        return "change-password"; // Change password
    }
}
