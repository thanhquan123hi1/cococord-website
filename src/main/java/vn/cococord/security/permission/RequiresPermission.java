package vn.cococord.security.permission;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to check if user has required permission before executing method
 * Used with PermissionAspect for AOP-based permission checking
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresPermission {
    
    /**
     * The permission name(s) required to execute this method
     * e.g., "MANAGE_MESSAGES", "KICK_MEMBERS", "MANAGE_CHANNELS"
     */
    String[] value();
    
    /**
     * If true, user must have ALL permissions listed
     * If false, user only needs ONE of the permissions
     * Default: false (OR logic)
     */
    boolean requireAll() default false;
    
    /**
     * Parameter name containing the serverId
     * Used to determine which server's permissions to check
     */
    String serverIdParam() default "serverId";
    
    /**
     * Parameter name containing the channelId (optional)
     * Used for channel-specific permission checks
     */
    String channelIdParam() default "channelId";
}
