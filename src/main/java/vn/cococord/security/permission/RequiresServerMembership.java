package vn.cococord.security.permission;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to check if user is a server member before executing method
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresServerMembership {
    
    /**
     * Parameter name containing the serverId
     */
    String serverIdParam() default "serverId";
}
