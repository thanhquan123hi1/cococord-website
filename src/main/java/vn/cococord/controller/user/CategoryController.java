package vn.cococord.controller.user;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.cococord.dto.request.CreateCategoryRequest;
import vn.cococord.dto.response.CategoryResponse;
import vn.cococord.service.ICategoryService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class CategoryController {

    private final ICategoryService categoryService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Get all categories in a server
     */
    @GetMapping("/servers/{serverId}/categories")
    public ResponseEntity<List<CategoryResponse>> getServerCategories(
            @PathVariable Long serverId,
            Authentication authentication) {
        String username = authentication.getName();
        List<CategoryResponse> categories = categoryService.getServerCategories(serverId, username);
        return ResponseEntity.ok(categories);
    }

    /**
     * Get a specific category by ID
     */
    @GetMapping("/categories/{categoryId}")
    public ResponseEntity<CategoryResponse> getCategoryById(
            @PathVariable Long categoryId,
            Authentication authentication) {
        String username = authentication.getName();
        CategoryResponse category = categoryService.getCategoryById(categoryId, username);
        return ResponseEntity.ok(category);
    }

    /**
     * Create a new category in a server
     */
    @PostMapping("/servers/{serverId}/categories")
    public ResponseEntity<CategoryResponse> createCategory(
            @PathVariable Long serverId,
            @Valid @RequestBody CreateCategoryRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        CategoryResponse category = categoryService.createCategory(serverId, request, username);
        
        // Broadcast category created event via WebSocket
        broadcastCategoryEvent(serverId, "category.created", category);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(category);
    }

    /**
     * Update a category
     */
    @PutMapping("/categories/{categoryId}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long categoryId,
            @Valid @RequestBody CreateCategoryRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        CategoryResponse category = categoryService.updateCategory(categoryId, request, username);
        
        // Broadcast category updated event via WebSocket
        broadcastCategoryEvent(category.getServerId(), "category.updated", category);
        
        return ResponseEntity.ok(category);
    }

    /**
     * Delete a category
     */
    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long categoryId,
            Authentication authentication) {
        String username = authentication.getName();
        
        // Get category info before deletion for broadcasting
        CategoryResponse category = categoryService.getCategoryById(categoryId, username);
        Long serverId = category.getServerId();
        
        categoryService.deleteCategory(categoryId, username);
        
        // Broadcast category deleted event via WebSocket
        broadcastCategoryEvent(serverId, "category.deleted", Map.of(
            "categoryId", categoryId,
            "serverId", serverId
        ));
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Update category position
     */
    @PatchMapping("/categories/{categoryId}/position")
    public ResponseEntity<CategoryResponse> updateCategoryPosition(
            @PathVariable Long categoryId,
            @RequestBody Map<String, Integer> request,
            Authentication authentication) {
        String username = authentication.getName();
        Integer position = request.get("position");
        
        if (position == null) {
            return ResponseEntity.badRequest().build();
        }
        
        CategoryResponse category = categoryService.updateCategoryPosition(categoryId, position, username);
        
        // Broadcast category updated event
        broadcastCategoryEvent(category.getServerId(), "category.updated", category);
        
        return ResponseEntity.ok(category);
    }

    /**
     * Broadcast category events to all server members via WebSocket
     */
    private void broadcastCategoryEvent(Long serverId, String eventType, Object payload) {
        try {
            Map<String, Object> event = Map.of(
                "type", eventType,
                "payload", payload
            );
            messagingTemplate.convertAndSend("/topic/server/" + serverId + "/categories", event);
            log.debug("Broadcasted {} event for server {}", eventType, serverId);
        } catch (Exception e) {
            log.error("Failed to broadcast category event: {}", e.getMessage());
        }
    }
}
