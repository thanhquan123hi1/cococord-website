package vn.cococord.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark methods that require server membership to execute.
 * The server ID will be extracted from method parameters named "serverId"
 * or from the request URL.
 * 
 * Usage:
 * @RequiresServerMembership
 * public void someMethod(Long serverId, ...)
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresServerMembership {
}
