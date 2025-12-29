package vn.cococord.security.permission;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to check if user is the owner of a resource or has required permission
 * Useful for actions like "delete own message" or "edit own profile"
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresOwnerOrPermission {
    
    /**
     * The permission name required if user is not the owner
     * e.g., "MANAGE_MESSAGES" to delete others' messages
     */
    String permission();
    
    /**
     * Parameter name containing the resource owner's userId
     */
    String ownerIdParam() default "userId";
    
    /**
     * Parameter name containing the serverId
     */
    String serverIdParam() default "serverId";
}
