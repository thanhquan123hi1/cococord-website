package vn.cococord.controller;

import java.util.Collections;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.response.ServerResponse;
import vn.cococord.dto.response.UserProfileResponse;
import vn.cococord.service.IServerService;
import vn.cococord.service.IUserService;

/**
 * Global Controller Advice để tự động nạp dữ liệu chung cho tất cả các view.
 * Các biến được nạp sẽ tự động có sẵn trong JSP mà không cần
 * model.addAttribute() thủ công trong từng Controller.
 */
@ControllerAdvice
@RequiredArgsConstructor
@Slf4j
public class GlobalDataControllerAdvice {

    private final IServerService serverService;
    private final IUserService userService;

    /**
     * Tự động nạp danh sách server của user hiện tại cho tất cả các view.
     * Trả về list rỗng nếu user chưa đăng nhập để tránh NullPointerException trong JSP.
     *
     * @return List<ServerResponse> danh sách server của user, hoặc list rỗng nếu chưa đăng nhập
     */
    @ModelAttribute("servers")
    public List<ServerResponse> getServersForCurrentUser() {
        try {
            String username = getCurrentUsername();
            if (username == null) {
                return Collections.emptyList();
            }
            return serverService.getServersByUsername(username);
        } catch (Exception e) {
            log.warn("Failed to load servers for current user: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Tự động nạp thông tin user hiện tại cho tất cả các view.
     * Trả về null nếu user chưa đăng nhập.
     *
     * @return UserProfileResponse thông tin user, hoặc null nếu chưa đăng nhập
     */
    @ModelAttribute("currentUser")
    public UserProfileResponse getCurrentUser() {
        try {
            String username = getCurrentUsername();
            if (username == null) {
                return null;
            }
            return userService.getUserProfileByUsername(username);
        } catch (Exception e) {
            log.warn("Failed to load current user profile: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Lấy username của user đang đăng nhập từ SecurityContext.
     *
     * @return username hoặc null nếu chưa đăng nhập
     */
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        
        Object principal = authentication.getPrincipal();
        
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            // Nếu principal là "anonymousUser" thì user chưa đăng nhập
            String principalStr = (String) principal;
            if ("anonymousUser".equals(principalStr)) {
                return null;
            }
            return principalStr;
        }
        
        return null;
    }
}
