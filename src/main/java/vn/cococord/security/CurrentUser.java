package vn.cococord.security;

import java.lang.annotation.*;

/**
 * Custom annotation to inject the current authenticated user into controller methods.
 * Usage: @CurrentUser User user
 */
@Target({ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface CurrentUser {
}
