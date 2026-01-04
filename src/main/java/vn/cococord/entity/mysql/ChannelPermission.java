package vn.cococord.entity.mysql;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Discord-style Channel Permission Overrides
 * 
 * Hỗ trợ ghi đè quyền (allow/deny) cho User hoặc Role cụ thể trong một Channel
 * 
 * Logic tính toán permission:
 * 1. Base permissions (từ Server Roles)
 * 2. Apply Channel Deny overrides (role-level)
 * 3. Apply Channel Allow overrides (role-level)
 * 4. Apply Channel Deny overrides (user-level)
 * 5. Apply Channel Allow overrides (user-level)
 * 
 * Lưu ý: User-specific overrides sẽ override Role-based overrides
 * 
 * Example:
 * - Role @Member có SEND_MESSAGES ở server level
 * - Channel #announcements có Deny SEND_MESSAGES cho @Member role
 * - User Alice có Allow SEND_MESSAGES ở #announcements channel
 * => Alice có thể gửi tin nhắn, nhưng @Member khác thì không
 */
@Entity
@Table(name = "channel_permissions", 
       uniqueConstraints = @UniqueConstraint(columnNames = { "channel_id", "target_type", "target_id" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChannelPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    private Channel channel;

    /**
     * Loại target: USER hoặc ROLE
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 10)
    private TargetType targetType;

    /**
     * ID của User hoặc Role (tùy theo targetType)
     */
    @Column(name = "target_id", nullable = false)
    private Long targetId;

    /**
     * Bitmask cho các permissions được ALLOW
     * Sử dụng PermissionBit enum để encode/decode
     * 
     * Example: allowBitmask = SEND_MESSAGES.getValue() | ATTACH_FILES.getValue()
     */
    @Column(nullable = false)
    @Builder.Default
    private Long allowBitmask = 0L;

    /**
     * Bitmask cho các permissions bị DENY
     * Deny có priority cao hơn Allow trong cùng level (role hoặc user)
     * 
     * Example: denyBitmask = MENTION_EVERYONE.getValue()
     */
    @Column(nullable = false)
    @Builder.Default
    private Long denyBitmask = 0L;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Enum định nghĩa loại target của permission override
     */
    public enum TargetType {
        /**
         * Permission override áp dụng cho một User cụ thể
         */
        USER,
        
        /**
         * Permission override áp dụng cho một Role cụ thể
         */
        ROLE
    }
    
    // ===== HELPER METHODS =====
    
    /**
     * Thêm một permission vào allow list
     * @param permissionBit Permission cần allow
     */
    public void allowPermission(PermissionBit permissionBit) {
        this.allowBitmask |= permissionBit.getValue();
        // Remove from deny if exists
        this.denyBitmask &= ~permissionBit.getValue();
    }
    
    /**
     * Thêm một permission vào deny list
     * @param permissionBit Permission cần deny
     */
    public void denyPermission(PermissionBit permissionBit) {
        this.denyBitmask |= permissionBit.getValue();
        // Remove from allow if exists
        this.allowBitmask &= ~permissionBit.getValue();
    }
    
    /**
     * Xóa permission khỏi cả allow và deny (inherit từ role)
     * @param permissionBit Permission cần reset
     */
    public void neutralPermission(PermissionBit permissionBit) {
        this.allowBitmask &= ~permissionBit.getValue();
        this.denyBitmask &= ~permissionBit.getValue();
    }
    
    /**
     * Kiểm tra xem permission có được allow không
     * @param permissionBit Permission cần check
     * @return true nếu permission được allow
     */
    public boolean isAllowed(PermissionBit permissionBit) {
        return permissionBit.isSet(this.allowBitmask);
    }
    
    /**
     * Kiểm tra xem permission có bị deny không
     * @param permissionBit Permission cần check
     * @return true nếu permission bị deny
     */
    public boolean isDenied(PermissionBit permissionBit) {
        return permissionBit.isSet(this.denyBitmask);
    }
    
    /**
     * Kiểm tra xem có phải là override cho User không
     * @return true nếu target là USER
     */
    public boolean isUserOverride() {
        return TargetType.USER.equals(this.targetType);
    }
    
    /**
     * Kiểm tra xem có phải là override cho Role không
     * @return true nếu target là ROLE
     */
    public boolean isRoleOverride() {
        return TargetType.ROLE.equals(this.targetType);
    }
}

