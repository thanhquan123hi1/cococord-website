package vn.cococord.dto.permission;

import java.util.HashSet;
import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.cococord.entity.mysql.PermissionBit;

/**
 * DTO cho kết quả tính toán permissions của một User trong một Channel
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComputedPermissionsDTO {
    
    private Long userId;
    private Long channelId;
    
    /**
     * Final bitmask sau khi tính toán tất cả overrides
     */
    private Long finalBitmask;
    
    /**
     * Danh sách permissions được allow (dạng tên)
     */
    @Builder.Default
    private Set<String> allowedPermissions = new HashSet<>();
    
    /**
     * Có phải là server owner không (bypass all permissions)
     */
    @Builder.Default
    private Boolean isServerOwner = false;
    
    /**
     * Có phải là administrator không
     */
    @Builder.Default
    private Boolean isAdministrator = false;
    
    /**
     * Có thể xem channel không
     */
    @Builder.Default
    private Boolean canViewChannel = false;
    
    /**
     * Có thể gửi tin nhắn không
     */
    @Builder.Default
    private Boolean canSendMessages = false;
    
    /**
     * Có thể quản lý tin nhắn không
     */
    @Builder.Default
    private Boolean canManageMessages = false;
    
    /**
     * Có thể connect vào voice không
     */
    @Builder.Default
    private Boolean canConnect = false;
    
    /**
     * Có thể nói trong voice không
     */
    @Builder.Default
    private Boolean canSpeak = false;
    
    /**
     * Kiểm tra xem có permission cụ thể không
     * @param permissionName Tên permission
     * @return true nếu có permission
     */
    public boolean hasPermission(String permissionName) {
        return allowedPermissions.contains(permissionName);
    }
    
    /**
     * Kiểm tra xem có permission cụ thể không (by PermissionBit)
     * @param bit PermissionBit
     * @return true nếu có permission
     */
    public boolean hasPermission(PermissionBit bit) {
        return bit.isSet(finalBitmask);
    }
    
    /**
     * Convert bitmask sang Set<String> và populate các boolean flags
     */
    public void populateFromBitmask() {
        this.allowedPermissions = new HashSet<>();
        
        for (PermissionBit bit : PermissionBit.values()) {
            if (bit.isSet(finalBitmask)) {
                this.allowedPermissions.add(bit.getName());
            }
        }
        
        // Populate boolean flags
        this.canViewChannel = PermissionBit.VIEW_CHANNEL.isSet(finalBitmask);
        this.canSendMessages = PermissionBit.SEND_MESSAGES.isSet(finalBitmask);
        this.canManageMessages = PermissionBit.MANAGE_MESSAGES.isSet(finalBitmask);
        this.canConnect = PermissionBit.CONNECT.isSet(finalBitmask);
        this.canSpeak = PermissionBit.SPEAK.isSet(finalBitmask);
        this.isAdministrator = PermissionBit.ADMINISTRATOR.isSet(finalBitmask);
    }
}
