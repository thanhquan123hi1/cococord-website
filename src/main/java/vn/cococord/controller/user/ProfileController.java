package vn.cococord.controller.user;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.request.SetUserNoteRequest;
import vn.cococord.dto.request.UpdateStatusRequest;
import vn.cococord.dto.request.UpdateUserSettingsRequest;
import vn.cococord.dto.response.MessageResponse;
import vn.cococord.dto.response.ServerResponse;
import vn.cococord.dto.response.UserProfileResponse;
import vn.cococord.service.IPresenceService;
import vn.cococord.service.IUserService;

/**
 * REST Controller for User Profile & Presence Management
 * Handles profile updates, status changes, avatar/banner uploads, user settings
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class ProfileController {
    
    private final IUserService userService;
    private final IPresenceService presenceService;

    /**
     * GET /api/users/me/profile
     * Get current user's full profile
     */
    @GetMapping("/me/profile")
    public ResponseEntity<UserProfileResponse> getCurrentUserProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.getUserProfileByUsername(userDetails.getUsername()));
    }

    /**
     * GET /api/users/{userId}/profile
     * Get user profile by ID
     */
    @GetMapping("/{userId}/profile")
    public ResponseEntity<UserProfileResponse> getUserProfile(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserProfileResponse profile = userService.getUserProfileById(userId, userDetails.getUsername());
        return ResponseEntity.ok(profile);
    }

    /**
     * PUT /api/users/me/settings
     * Update user settings (username, email, bio, pronouns, theme, privacy)
     */
    @PutMapping("/me/settings")
    public ResponseEntity<UserProfileResponse> updateSettings(
            @Valid @RequestBody UpdateUserSettingsRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserProfileResponse profile = userService.updateUserSettings(request, userDetails.getUsername());
        return ResponseEntity.ok(profile);
    }

    /**
     * PUT /api/users/me/status
     * Update user status and custom status
     */
    @PutMapping("/me/status")
    public ResponseEntity<MessageResponse> updateStatus(
            @Valid @RequestBody UpdateStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        presenceService.updateStatus(request, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Status updated successfully"));
    }

    /**
     * DELETE /api/users/me/custom-status
     * Clear custom status
     */
    @DeleteMapping("/me/custom-status")
    public ResponseEntity<MessageResponse> clearCustomStatus(
            @AuthenticationPrincipal UserDetails userDetails) {
        UpdateStatusRequest request = UpdateStatusRequest.builder()
                .status(presenceService.getUserStatus(userDetails.getUsername()))
                .customStatus(null)
                .customStatusEmoji(null)
                .build();
        presenceService.updateStatus(request, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Custom status cleared"));
    }

    /**
     * POST /api/users/me/avatar
     * Upload user avatar
     */
    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        String avatarUrl = userService.uploadAvatar(file, userDetails.getUsername());
        
        Map<String, String> response = new HashMap<>();
        response.put("avatarUrl", avatarUrl);
        response.put("message", "Avatar uploaded successfully");
        
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/users/me/banner
     * Upload user banner (profile background)
     */
    @PostMapping(value = "/me/banner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadBanner(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        String bannerUrl = userService.uploadBanner(file, userDetails.getUsername());
        
        Map<String, String> response = new HashMap<>();
        response.put("bannerUrl", bannerUrl);
        response.put("message", "Banner uploaded successfully");
        
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/users/{userId}/note
     * Set private note about another user
     */
    @PostMapping("/{userId}/note")
    public ResponseEntity<MessageResponse> setUserNote(
            @PathVariable Long userId,
            @Valid @RequestBody SetUserNoteRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        userService.setUserNote(userId, request, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Note saved successfully"));
    }

    /**
     * GET /api/users/{userId}/mutual-servers
     * Get mutual servers with another user
     */
    @GetMapping("/{userId}/mutual-servers")
    public ResponseEntity<List<ServerResponse>> getMutualServers(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ServerResponse> servers = userService.getMutualServers(userId, userDetails.getUsername());
        return ResponseEntity.ok(servers);
    }

    /**
     * GET /api/users/presence
     * Get presence status for multiple users
     */
    @GetMapping("/presence")
    public ResponseEntity<Map<Long, String>> getUsersPresence(
            @RequestParam List<Long> userIds) {
        Map<Long, String> presence = presenceService.getUsersPresence(userIds);
        return ResponseEntity.ok(presence);
    }

    /**
     * POST /api/users/me/activity
     * Update last activity (to prevent auto-idle)
     */
    @PostMapping("/me/activity")
    public ResponseEntity<Void> updateActivity(
            @AuthenticationPrincipal UserDetails userDetails) {
        presenceService.updateLastActivity(userDetails.getUsername());
        return ResponseEntity.ok().build();
    }
}
