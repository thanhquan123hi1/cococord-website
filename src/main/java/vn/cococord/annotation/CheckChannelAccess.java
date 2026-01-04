package vn.cococord.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation để kiểm tra quyền truy cập vào Channel
 * Sử dụng trong Controller methods để validate channel permissions
 * 
 * Usage:
 * <pre>
 * @CheckChannelAccess(permission = "SEND_MESSAGES", channelIdParam = "channelId")
 * public ResponseEntity<?> sendMessage(@PathVariable Long channelId, @RequestBody MessageDTO dto) {
 *     // Method sẽ chỉ được execute nếu user có permission SEND_MESSAGES trong channel
 * }
 * </pre>
 * 
 * Logic:
 * 1. Lấy channelId từ method parameter (theo channelIdParam)
 * 2. Lấy userId từ SecurityContext (authenticated user)
 * 3. Gọi PermissionService.hasChannelPermission(userId, channelId, permission)
 * 4. Throw ForbiddenException nếu không có quyền
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface CheckChannelAccess {
    
    /**
     * Tên permission cần kiểm tra (phải match với PermissionBit.name)
     * Ví dụ: "SEND_MESSAGES", "VIEW_CHANNEL", "MANAGE_MESSAGES", "CONNECT"
     */
    String permission();
    
    /**
     * Tên parameter trong method signature chứa channelId
     * Default: "channelId"
     * 
     * Example:
     * Method: sendMessage(@PathVariable Long channelId, ...)
     * => channelIdParam = "channelId"
     * 
     * Method: sendMessage(@RequestParam("channel") Long id, ...)
     * => channelIdParam = "id"
     */
    String channelIdParam() default "channelId";
    
    /**
     * Message lỗi custom (optional)
     * Nếu không set, sẽ dùng message default
     */
    String message() default "";
    
    /**
     * Cho phép server owner bypass permission check không
     * Default: true (server owner luôn có quyền)
     */
    boolean allowOwnerBypass() default true;
    
    /**
     * Cho phép administrator bypass permission check không
     * Default: true (administrator luôn có quyền)
     */
    boolean allowAdminBypass() default true;
}
