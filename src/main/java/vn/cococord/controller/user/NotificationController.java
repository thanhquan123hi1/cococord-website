package vn.cococord.controller.user;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.cococord.dto.response.NotificationResponse;
import vn.cococord.service.INotificationService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor

public class NotificationController {

    private final INotificationService notificationService;

    @GetMapping

    public ResponseEntity<Page<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(notificationService.getNotifications(userDetails.getUsername(), pageable));
    }

    @GetMapping("/unread")

    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(notificationService.getUnreadNotifications(userDetails.getUsername()));
    }

    @GetMapping("/count")

    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails) {
        long count = notificationService.getUnreadCount(userDetails.getUsername());
        Map<String, Long> response = new HashMap<>();
        response.put("count", count);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/read")

    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean success = notificationService.markAsRead(id, userDetails.getUsername());
        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/read-all")

    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @AuthenticationPrincipal UserDetails userDetails) {
        int updated = notificationService.markAllAsRead(userDetails.getUsername());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("updatedCount", updated);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")

    public ResponseEntity<Map<String, Object>> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean success = notificationService.deleteNotification(id, userDetails.getUsername());
        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cleanup")

    public ResponseEntity<Map<String, Object>> cleanupNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "30") int daysOld) {
        int deleted = notificationService.cleanupOldNotifications(userDetails.getUsername(), daysOld);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("deletedCount", deleted);
        return ResponseEntity.ok(response);
    }
}
