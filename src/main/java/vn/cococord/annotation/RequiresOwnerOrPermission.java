package vn.cococord.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark methods that can be executed by either:
 * 1. The owner of the resource (e.g., message author, server owner)
 * 2. A user with the specified permission
 * 
 * This is useful for actions like "delete message" where the author can delete
 * their own messages, but moderators with MANAGE_MESSAGES can delete any message.
 * 
 * Usage:
 * @RequiresOwnerOrPermission(permission = "MANAGE_MESSAGES", ownerIdParam = "userId")
 * public void deleteMessage(String messageId, Long userId, ...)
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresOwnerOrPermission {
    
    /**
     * The permission name required if the user is not the owner.
     */
    String permission();
    
    /**
     * The name of the method parameter that contains the owner's user ID.
     * The aspect will extract this value and compare it to the current user's ID.
     */
    String ownerIdParam() default "userId";
}
