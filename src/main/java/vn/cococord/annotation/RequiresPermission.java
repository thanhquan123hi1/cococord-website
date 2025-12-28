package vn.cococord.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark methods that require specific permission(s) to execute.
 * Can be used on controller methods to enforce permission checks via AOP.
 * 
 * Usage:
 * - @RequiresPermission("MANAGE_MESSAGES") - requires single permission
 * - @RequiresPermission({"MANAGE_MESSAGES", "KICK_MEMBERS"}) - requires any of these permissions
 * - @RequiresPermission(value = {"MANAGE_MESSAGES", "KICK_MEMBERS"}, requireAll = true) - requires all permissions
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresPermission {
    
    /**
     * The permission name(s) required to execute this method.
     * By default, having any one of these permissions is sufficient.
     */
    String[] value();
    
    /**
     * If true, the user must have ALL specified permissions.
     * If false (default), the user needs only ONE of the specified permissions.
     */
    boolean requireAll() default false;
}
