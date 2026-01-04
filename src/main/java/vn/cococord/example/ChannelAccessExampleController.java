package vn.cococord.example;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.annotation.CheckChannelAccess;
import vn.cococord.annotation.RequiresServerMembership;

/**
 * ======================================================================
 * EXAMPLE: Cách sử dụng @CheckChannelAccess trong Controller
 * ======================================================================
 * 
 * File này demonstrate các use cases phổ biến cho Channel Permission System
 * Copy các patterns này vào MessageController, ChannelController, etc.
 */
@RestController
@RequestMapping("/api/example")
@RequiredArgsConstructor
@Slf4j
public class ChannelAccessExampleController {
    
    // ===== EXAMPLE 1: Gửi tin nhắn trong channel =====
    /**
     * POST /api/channels/123/messages
     * User phải có permission SEND_MESSAGES trong channel để gửi tin nhắn
     */
    @PostMapping("/channels/{channelId}/messages")
    @CheckChannelAccess(
        permission = "SEND_MESSAGES",
        channelIdParam = "channelId",
        message = "Bạn không có quyền gửi tin nhắn trong kênh này"
    )
    public ResponseEntity<String> sendMessage(
            @PathVariable Long channelId,
            @RequestBody String messageContent) {
        
        log.info("Sending message to channel {}: {}", channelId, messageContent);
        
        // Logic gửi tin nhắn ở đây
        // Aspect đã validate permission rồi, nên code này chỉ chạy khi user có quyền
        
        return ResponseEntity.ok("Message sent successfully");
    }
    
    // ===== EXAMPLE 2: Xóa tin nhắn (quản lý tin nhắn) =====
    /**
     * DELETE /api/channels/123/messages/456
     * User phải có permission MANAGE_MESSAGES để xóa tin nhắn người khác
     */
    @DeleteMapping("/channels/{channelId}/messages/{messageId}")
    @CheckChannelAccess(
        permission = "MANAGE_MESSAGES",
        channelIdParam = "channelId",
        message = "Bạn không có quyền xóa tin nhắn trong kênh này"
    )
    public ResponseEntity<Void> deleteMessage(
            @PathVariable Long channelId,
            @PathVariable Long messageId) {
        
        log.info("Deleting message {} from channel {}", messageId, channelId);
        
        // Logic xóa tin nhắn
        
        return ResponseEntity.noContent().build();
    }
    
    // ===== EXAMPLE 3: Xem kênh (đọc tin nhắn) =====
    /**
     * GET /api/channels/123/messages
     * User phải có permission VIEW_CHANNEL để xem tin nhắn
     */
    @GetMapping("/channels/{channelId}/messages")
    @CheckChannelAccess(
        permission = "VIEW_CHANNEL",
        channelIdParam = "channelId",
        message = "Bạn không có quyền xem kênh này"
    )
    public ResponseEntity<String> getMessages(@PathVariable Long channelId) {
        log.info("Loading messages from channel {}", channelId);
        
        // Logic lấy danh sách tin nhắn
        
        return ResponseEntity.ok("Messages loaded");
    }
    
    // ===== EXAMPLE 4: Đính kèm file =====
    /**
     * POST /api/channels/123/attachments
     * User phải có cả VIEW_CHANNEL và ATTACH_FILES
     * 
     * NOTE: Để check nhiều permissions, gọi service trong method body
     * hoặc dùng 2 annotations (nhưng phức tạp hơn)
     */
    @PostMapping("/channels/{channelId}/attachments")
    @CheckChannelAccess(
        permission = "ATTACH_FILES",
        channelIdParam = "channelId",
        message = "Bạn không có quyền đính kèm file trong kênh này"
    )
    public ResponseEntity<String> uploadAttachment(
            @PathVariable Long channelId,
            @RequestParam("file") String file) {
        
        log.info("Uploading attachment to channel {}", channelId);
        
        // Logic upload file
        
        return ResponseEntity.ok("File uploaded");
    }
    
    // ===== EXAMPLE 5: Join voice channel =====
    /**
     * POST /api/channels/123/voice/join
     * User phải có permission CONNECT để join voice
     */
    @PostMapping("/channels/{channelId}/voice/join")
    @CheckChannelAccess(
        permission = "CONNECT",
        channelIdParam = "channelId",
        message = "Bạn không có quyền kết nối vào kênh voice này"
    )
    public ResponseEntity<String> joinVoiceChannel(@PathVariable Long channelId) {
        log.info("User joining voice channel {}", channelId);
        
        // Logic join voice
        
        return ResponseEntity.ok("Joined voice channel");
    }
    
    // ===== EXAMPLE 6: Speak trong voice channel =====
    /**
     * POST /api/channels/123/voice/speak
     * User phải có permission SPEAK để nói trong voice
     */
    @PostMapping("/channels/{channelId}/voice/speak")
    @CheckChannelAccess(
        permission = "SPEAK",
        channelIdParam = "channelId",
        message = "Bạn không có quyền nói trong kênh voice này (có thể bị mute)"
    )
    public ResponseEntity<String> speakInVoice(@PathVariable Long channelId) {
        log.info("User speaking in voice channel {}", channelId);
        
        // Logic enable microphone
        
        return ResponseEntity.ok("Microphone enabled");
    }
    
    // ===== EXAMPLE 7: Tạo instant invite =====
    /**
     * POST /api/channels/123/invites
     * User phải có permission CREATE_INSTANT_INVITE
     */
    @PostMapping("/channels/{channelId}/invites")
    @CheckChannelAccess(
        permission = "CREATE_INSTANT_INVITE",
        channelIdParam = "channelId",
        message = "Bạn không có quyền tạo lời mời cho kênh này"
    )
    public ResponseEntity<String> createInvite(@PathVariable Long channelId) {
        log.info("Creating invite for channel {}", channelId);
        
        // Logic tạo invite link
        
        return ResponseEntity.ok("Invite created: https://cococord.vn/invite/abc123");
    }
    
    // ===== EXAMPLE 8: Quản lý channel (edit, delete) =====
    /**
     * PATCH /api/channels/123
     * User phải có permission MANAGE_CHANNELS để sửa channel
     */
    @PatchMapping("/channels/{channelId}")
    @CheckChannelAccess(
        permission = "MANAGE_CHANNELS",
        channelIdParam = "channelId",
        message = "Bạn không có quyền quản lý kênh này"
    )
    public ResponseEntity<String> updateChannel(
            @PathVariable Long channelId,
            @RequestBody String updates) {
        
        log.info("Updating channel {}: {}", channelId, updates);
        
        // Logic cập nhật channel (name, topic, etc.)
        
        return ResponseEntity.ok("Channel updated");
    }
    
    // ===== EXAMPLE 9: Combine với @RequiresServerMembership =====
    /**
     * Có thể combine nhiều annotations
     * @RequiresServerMembership check user là member
     * @CheckChannelAccess check channel permission
     */
    @PostMapping("/channels/{channelId}/pins")
    @RequiresServerMembership // Check server membership first
    @CheckChannelAccess(
        permission = "MANAGE_MESSAGES",
        channelIdParam = "channelId"
    )
    public ResponseEntity<String> pinMessage(
            @PathVariable Long channelId,
            @RequestParam Long messageId) {
        
        log.info("Pinning message {} in channel {}", messageId, channelId);
        
        // Logic pin message
        
        return ResponseEntity.ok("Message pinned");
    }
    
    // ===== EXAMPLE 10: Bypass admin check (optional) =====
    /**
     * Trong một số trường hợp hiếm hoi, bạn không muốn admin bypass
     * (ví dụ: channel rules phải apply cho tất cả mọi người)
     */
    @PostMapping("/channels/{channelId}/strict-messages")
    @CheckChannelAccess(
        permission = "SEND_MESSAGES",
        channelIdParam = "channelId",
        allowOwnerBypass = false,  // Owner vẫn phải tuân thủ permission
        allowAdminBypass = false   // Admin cũng phải có permission
    )
    public ResponseEntity<String> sendStrictMessage(
            @PathVariable Long channelId,
            @RequestBody String messageContent) {
        
        // Logic gửi tin nhắn - áp dụng strict permission check
        
        return ResponseEntity.ok("Strict message sent");
    }
    
    // ===== EXAMPLE 11: Custom channelIdParam name =====
    /**
     * Nếu parameter không tên là "channelId", chỉ định tên khác
     */
    @GetMapping("/chat/{id}/history")
    @CheckChannelAccess(
        permission = "READ_MESSAGE_HISTORY",
        channelIdParam = "id",  // Parameter tên là "id" thay vì "channelId"
        message = "Bạn không có quyền xem lịch sử tin nhắn"
    )
    public ResponseEntity<String> getMessageHistory(@PathVariable Long id) {
        log.info("Loading message history for channel {}", id);
        
        // Logic load message history
        
        return ResponseEntity.ok("History loaded");
    }
}
