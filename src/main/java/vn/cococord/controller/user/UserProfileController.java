package vn.cococord.controller.user;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.cococord.dto.request.UpdateProfileRequest;
import vn.cococord.dto.response.MessageResponse;
import vn.cococord.dto.response.UserProfileResponse;
import vn.cococord.service.IUserService;

/**
 * REST Controller for User Profile Management
 * Handles profile updates, status changes, and user settings
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserProfileController {
    private final IUserService userService;

    /**
     * GET /api/users/me
     * Get current user profile (already exists in AuthController)
     * This is a duplicate endpoint for convenience
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUserProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement userService.getUserProfile(userDetails.getUsername())
        return ResponseEntity.ok(UserProfileResponse.builder().build());
    }

    /**
     * GET /api/users/{userId}
     * Get user profile by ID
     */
    @GetMapping("/{userId}")
    public ResponseEntity<UserProfileResponse> getUserProfile(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement userService.getUserProfileById(userId)
        return ResponseEntity.ok(UserProfileResponse.builder().build());
    }

    /**
     * GET /api/users/username/{username}
     * Get user profile by username
     */
    @GetMapping("/username/{username}")
    public ResponseEntity<UserProfileResponse> getUserProfileByUsername(
            @PathVariable String username,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.getUserProfileByUsername(username));
    }

    /**
     * PUT /api/users/me
     * Update current user profile
     */
    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement userService.updateProfile(request, userDetails.getUsername())
        return ResponseEntity.ok(UserProfileResponse.builder().build());
    }

    /**
     * PUT /api/users/me/status
     * Update user status (ONLINE, IDLE, DO_NOT_DISTURB, OFFLINE, INVISIBLE)
     */
    @PutMapping("/me/status")
    public ResponseEntity<MessageResponse> updateStatus(
            @RequestParam String status,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement userService.updateStatus(status, userDetails.getUsername())
        return ResponseEntity.ok(new MessageResponse("Status updated successfully"));
    }

    /**
     * PUT /api/users/me/custom-status
     * Update custom status message
     */
    @PutMapping("/me/custom-status")
    public ResponseEntity<MessageResponse> updateCustomStatus(
            @RequestParam String customStatus,
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement userService.updateCustomStatus(customStatus,
        // userDetails.getUsername())
        return ResponseEntity.ok(new MessageResponse("Custom status updated successfully"));
    }

    /**
     * DELETE /api/users/me/custom-status
     * Clear custom status
     */
    @DeleteMapping("/me/custom-status")
    public ResponseEntity<MessageResponse> clearCustomStatus(
            @AuthenticationPrincipal UserDetails userDetails) {
        // TODO: Implement userService.clearCustomStatus(userDetails.getUsername())
        return ResponseEntity.ok(new MessageResponse("Custom status cleared"));
    }

    /**
     * GET /api/users/search
     * Search users by username or email
     */
    @GetMapping("/search")
    public ResponseEntity<java.util.List<UserProfileResponse>> searchUsers(
            @RequestParam String query,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.searchUsers(query, userDetails.getUsername()));
    }
}
