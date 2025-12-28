package vn.cococord.aspect;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import vn.cococord.annotation.RequiresOwnerOrPermission;
import vn.cococord.annotation.RequiresPermission;
import vn.cococord.annotation.RequiresServerMembership;
import vn.cococord.entity.mysql.User;
import vn.cococord.exception.ForbiddenException;
import vn.cococord.exception.UnauthorizedException;
import vn.cococord.repository.IUserRepository;
import vn.cococord.service.IPermissionService;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.Optional;

/**
 * AOP Aspect for permission checking before executing controller methods.
 * Supports annotations:
 * - @RequiresPermission: Check if user has specific permission(s)
 * - @RequiresServerMembership: Check if user is a member of the server
 * - @RequiresOwnerOrPermission: Check if user owns resource or has permission
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
@Order(1) // Execute before other aspects
public class PermissionAspect {
    
    private final IPermissionService permissionService;
    private final IUserRepository userRepository;
    
    /**
     * Check permissions before method execution
     */
    @Around("@annotation(requiresPermission)")
    public Object checkPermission(ProceedingJoinPoint joinPoint, RequiresPermission requiresPermission) throws Throwable {
        Long userId = getCurrentUserId();
        Long serverId = extractServerId(joinPoint);
        
        if (serverId == null) {
            throw new ForbiddenException("Server ID is required for permission check");
        }
        
        String[] permissions = requiresPermission.value();
        boolean requireAll = requiresPermission.requireAll();
        
        boolean hasPermission;
        if (requireAll) {
            hasPermission = permissionService.hasAllPermissions(userId, serverId, permissions);
        } else {
            hasPermission = permissionService.hasAnyPermission(userId, serverId, permissions);
        }
        
        if (!hasPermission) {
            log.warn("User {} denied permission {} in server {}", userId, String.join(", ", permissions), serverId);
            throw new ForbiddenException("You do not have permission to perform this action");
        }
        
        log.debug("User {} granted permission {} in server {}", userId, String.join(", ", permissions), serverId);
        return joinPoint.proceed();
    }
    
    /**
     * Check server membership before method execution
     */
    @Around("@annotation(requiresServerMembership)")
    public Object checkServerMembership(ProceedingJoinPoint joinPoint, RequiresServerMembership requiresServerMembership) throws Throwable {
        Long userId = getCurrentUserId();
        Long serverId = extractServerId(joinPoint);
        
        if (serverId == null) {
            throw new ForbiddenException("Server ID is required for membership check");
        }
        
        if (!permissionService.isMember(userId, serverId)) {
            log.warn("User {} is not a member of server {}", userId, serverId);
            throw new ForbiddenException("You must be a member of this server");
        }
        
        log.debug("User {} is a member of server {}", userId, serverId);
        return joinPoint.proceed();
    }
    
    /**
     * Check owner or permission before method execution
     */
    @Around("@annotation(requiresOwnerOrPermission)")
    public Object checkOwnerOrPermission(ProceedingJoinPoint joinPoint, RequiresOwnerOrPermission requiresOwnerOrPermission) throws Throwable {
        Long userId = getCurrentUserId();
        Long serverId = extractServerId(joinPoint);
        Long resourceOwnerId = extractResourceOwnerId(joinPoint, requiresOwnerOrPermission.ownerIdParam());
        
        // If user is the resource owner, allow access
        if (resourceOwnerId != null && userId.equals(resourceOwnerId)) {
            log.debug("User {} is the owner of the resource", userId);
            return joinPoint.proceed();
        }
        
        // Otherwise, check if user has the required permission
        if (serverId == null) {
            throw new ForbiddenException("Server ID is required for permission check");
        }
        
        String permission = requiresOwnerOrPermission.permission();
        if (!permissionService.hasPermission(userId, serverId, permission)) {
            log.warn("User {} denied - not owner and lacks permission {} in server {}", userId, permission, serverId);
            throw new ForbiddenException("You do not have permission to perform this action");
        }
        
        log.debug("User {} granted access via permission {} in server {}", userId, permission, serverId);
        return joinPoint.proceed();
    }
    
    /**
     * Get the current authenticated user's ID
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("User not authenticated");
        }
        
        Object principal = authentication.getPrincipal();
        String username;
        
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            if ("anonymousUser".equals(principal)) {
                throw new UnauthorizedException("User not authenticated");
            }
            username = (String) principal;
        } else {
            throw new UnauthorizedException("Unable to determine user identity");
        }
        
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            throw new UnauthorizedException("User not found");
        }
        
        return userOpt.get().getId();
    }
    
    /**
     * Extract server ID from method parameters
     * Looks for parameters named "serverId" or annotated with specific markers
     */
    private Long extractServerId(ProceedingJoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        Object[] args = joinPoint.getArgs();
        String[] parameterNames = signature.getParameterNames();
        
        // First, try to find parameter named "serverId"
        for (int i = 0; i < parameterNames.length; i++) {
            if ("serverId".equals(parameterNames[i]) && args[i] != null) {
                return convertToLong(args[i]);
            }
        }
        
        // Try path variable from HTTP request
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String uri = request.getRequestURI();
            
            // Try to extract serverId from URL patterns like /api/servers/{serverId}/...
            String[] parts = uri.split("/");
            for (int i = 0; i < parts.length - 1; i++) {
                if ("servers".equals(parts[i]) && i + 1 < parts.length) {
                    try {
                        return Long.parseLong(parts[i + 1]);
                    } catch (NumberFormatException e) {
                        // Not a number, continue searching
                    }
                }
            }
            
            // Also check request parameters
            String serverIdParam = request.getParameter("serverId");
            if (serverIdParam != null) {
                try {
                    return Long.parseLong(serverIdParam);
                } catch (NumberFormatException e) {
                    log.warn("Invalid serverId parameter: {}", serverIdParam);
                }
            }
        }
        
        // Try to find a DTO parameter with getServerId() method
        for (Object arg : args) {
            if (arg != null) {
                try {
                    Method getServerId = arg.getClass().getMethod("getServerId");
                    Object result = getServerId.invoke(arg);
                    if (result != null) {
                        return convertToLong(result);
                    }
                } catch (NoSuchMethodException e) {
                    // Continue to next argument
                } catch (Exception e) {
                    log.warn("Error extracting serverId from argument: {}", e.getMessage());
                }
            }
        }
        
        return null;
    }
    
    /**
     * Extract resource owner ID from method parameters
     */
    private Long extractResourceOwnerId(ProceedingJoinPoint joinPoint, String ownerIdParam) {
        if (ownerIdParam == null || ownerIdParam.isEmpty()) {
            return null;
        }
        
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Object[] args = joinPoint.getArgs();
        String[] parameterNames = signature.getParameterNames();
        
        for (int i = 0; i < parameterNames.length; i++) {
            if (ownerIdParam.equals(parameterNames[i]) && args[i] != null) {
                return convertToLong(args[i]);
            }
        }
        
        // Try to find in DTO
        for (Object arg : args) {
            if (arg != null) {
                try {
                    String getterName = "get" + Character.toUpperCase(ownerIdParam.charAt(0)) + ownerIdParam.substring(1);
                    Method getter = arg.getClass().getMethod(getterName);
                    Object result = getter.invoke(arg);
                    if (result != null) {
                        return convertToLong(result);
                    }
                } catch (NoSuchMethodException e) {
                    // Continue to next argument
                } catch (Exception e) {
                    log.warn("Error extracting {} from argument: {}", ownerIdParam, e.getMessage());
                }
            }
        }
        
        return null;
    }
    
    /**
     * Convert object to Long
     */
    private Long convertToLong(Object value) {
        if (value instanceof Long) {
            return (Long) value;
        } else if (value instanceof Integer) {
            return ((Integer) value).longValue();
        } else if (value instanceof String) {
            try {
                return Long.parseLong((String) value);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}
