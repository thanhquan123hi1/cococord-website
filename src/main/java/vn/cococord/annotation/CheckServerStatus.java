package vn.cococord.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to check server lock/suspend status before executing method.
 * Used with ServerStatusAspect for AOP-based status checking.
 * 
 * When a server is LOCKED:
 * - Read-only operations are allowed
 * - Write operations (send message, create channel, etc.) are blocked
 * 
 * When a server is SUSPENDED:
 * - ALL operations are blocked (including read)
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface CheckServerStatus {

    /**
     * If true, allow read-only access when server is locked.
     * If false, block all access when locked.
     * Default: false (block all when locked)
     */
    boolean allowReadWhenLocked() default false;

    /**
     * Parameter name containing the serverId
     */
    String serverIdParam() default "serverId";

    /**
     * Parameter name containing the channelId (optional)
     * Will be used to resolve serverId if serverIdParam is not found
     */
    String channelIdParam() default "channelId";
}
