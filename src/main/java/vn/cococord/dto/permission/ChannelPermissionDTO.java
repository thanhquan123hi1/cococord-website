package vn.cococord.dto.permission;

import java.util.HashSet;
import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.cococord.entity.mysql.ChannelPermission.TargetType;
import vn.cococord.entity.mysql.PermissionBit;

/**
 * DTO cho Channel Permission Override
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChannelPermissionDTO {
    
    private Long id;
    private Long channelId;
    private TargetType targetType;
    private Long targetId;
    
    /**
     * Danh sách permissions được allow (dạng tên: "SEND_MESSAGES", "ATTACH_FILES", ...)
     */
    @Builder.Default
    private Set<String> allowedPermissions = new HashSet<>();
    
    /**
     * Danh sách permissions bị deny
     */
    @Builder.Default
    private Set<String> deniedPermissions = new HashSet<>();
    
    /**
     * Tên của target (Role name hoặc Username) - for display only
     */
    private String targetName;
    
    /**
     * Avatar URL (nếu target là User) - for display only
     */
    private String avatarUrl;
    
    /**
     * Color hex (nếu target là Role) - for display only
     */
    private String color;
    
    /**
     * Convert từ bitmask sang Set<String>
     * @param allowBitmask Allow bitmask
     * @param denyBitmask Deny bitmask
     */
    public void fromBitmasks(long allowBitmask, long denyBitmask) {
        this.allowedPermissions = new HashSet<>();
        this.deniedPermissions = new HashSet<>();
        
        for (PermissionBit bit : PermissionBit.values()) {
            if (bit.isSet(allowBitmask)) {
                this.allowedPermissions.add(bit.getName());
            }
            if (bit.isSet(denyBitmask)) {
                this.deniedPermissions.add(bit.getName());
            }
        }
    }
    
    /**
     * Convert từ Set<String> sang bitmask
     * @return Array [allowBitmask, denyBitmask]
     */
    public long[] toBitmasks() {
        long allowBitmask = 0L;
        long denyBitmask = 0L;
        
        for (String permName : this.allowedPermissions) {
            PermissionBit bit = PermissionBit.fromName(permName);
            if (bit != null) {
                allowBitmask |= bit.getValue();
            }
        }
        
        for (String permName : this.deniedPermissions) {
            PermissionBit bit = PermissionBit.fromName(permName);
            if (bit != null) {
                denyBitmask |= bit.getValue();
            }
        }
        
        return new long[] { allowBitmask, denyBitmask };
    }
}
