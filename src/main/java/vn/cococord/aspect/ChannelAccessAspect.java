package vn.cococord.aspect;

import java.lang.reflect.Method;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.annotation.CheckChannelAccess;
import vn.cococord.entity.mysql.Channel;
import vn.cococord.entity.mysql.PermissionBit;
import vn.cococord.entity.mysql.User;
import vn.cococord.exception.ForbiddenException;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.exception.UnauthorizedException;
import vn.cococord.repository.IChannelRepository;
import vn.cococord.repository.IUserRepository;
import vn.cococord.service.IPermissionService;

/**
 * AOP Aspect for @CheckChannelAccess annotation
 * Validates channel permissions before executing controller methods
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
@Order(2) // Execute after PermissionAspect
public class ChannelAccessAspect {
    
    private final IPermissionService permissionService;
    private final IUserRepository userRepository;
    private final IChannelRepository channelRepository;
    
    /**
     * Intercept methods with @CheckChannelAccess annotation
     */
    @Around("@annotation(checkChannelAccess)")
    public Object checkChannelAccess(ProceedingJoinPoint joinPoint, CheckChannelAccess checkChannelAccess) throws Throwable {
        log.debug("Checking channel access for permission: {}", checkChannelAccess.permission());
        
        // 1. Get current user
        Long userId = getCurrentUserId();
        if (userId == null) {
            log.warn("No authenticated user found for channel access check");
            throw new UnauthorizedException("Authentication required");
        }
        
        // 2. Extract channelId from method parameters
        Long channelId = extractChannelId(joinPoint, checkChannelAccess.channelIdParam());
        if (channelId == null) {
            log.error("Channel ID not found in method parameters (param name: {})", 
                      checkChannelAccess.channelIdParam());
            throw new ForbiddenException("Channel ID is required");
        }
        
        log.debug("Checking channel {} access for user {} with permission {}", 
                  channelId, userId, checkChannelAccess.permission());
        
        // 3. Verify channel exists
        Channel channel = channelRepository.findById(channelId)
            .orElseThrow(() -> new ResourceNotFoundException("Channel not found: " + channelId));
        
        Long serverId = channel.getServer().getId();
        
        // 4. Check if user is member of the server
        if (!permissionService.isMember(userId, serverId)) {
            log.warn("User {} is not a member of server {} (channel {})", userId, serverId, channelId);
            throw new ForbiddenException("You must be a member of this server to access this channel");
        }
        
        // 5. Check bypass conditions
        if (checkChannelAccess.allowOwnerBypass() && permissionService.isServerOwner(userId, serverId)) {
            log.debug("User {} is server owner, bypassing channel permission check", userId);
            return joinPoint.proceed();
        }
        
        if (checkChannelAccess.allowAdminBypass() && permissionService.isAdministrator(userId, serverId)) {
            log.debug("User {} is administrator, bypassing channel permission check", userId);
            return joinPoint.proceed();
        }
        
        // 6. Validate permission name
        PermissionBit permissionBit = PermissionBit.fromName(checkChannelAccess.permission());
        if (permissionBit == null) {
            log.error("Invalid permission name in @CheckChannelAccess: {}", checkChannelAccess.permission());
            throw new IllegalArgumentException("Invalid permission: " + checkChannelAccess.permission());
        }
        
        // 7. Check channel permission
        boolean hasPermission = permissionService.hasChannelPermission(userId, channelId, permissionBit);
        
        if (!hasPermission) {
            String errorMessage = checkChannelAccess.message().isEmpty()
                ? String.format("You do not have permission '%s' in this channel", checkChannelAccess.permission())
                : checkChannelAccess.message();
            
            log.warn("User {} denied access to channel {} (missing permission: {})", 
                     userId, channelId, checkChannelAccess.permission());
            
            throw new ForbiddenException(errorMessage);
        }
        
        log.debug("User {} granted access to channel {} with permission {}", 
                  userId, channelId, checkChannelAccess.permission());
        
        // 8. Proceed with method execution
        return joinPoint.proceed();
    }
    
    /**
     * Get current authenticated user ID from SecurityContext
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        
        Object principal = authentication.getPrincipal();
        
        if (principal instanceof UserDetails) {
            String username = ((UserDetails) principal).getUsername();
            return userRepository.findByUsername(username)
                .map(User::getId)
                .orElse(null);
        }
        
        return null;
    }
    
    /**
     * Extract channelId from method parameters
     * @param joinPoint Join point
     * @param paramName Name of parameter containing channelId
     * @return Channel ID or null if not found
     */
    private Long extractChannelId(ProceedingJoinPoint joinPoint, String paramName) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        String[] parameterNames = signature.getParameterNames();
        Object[] parameterValues = joinPoint.getArgs();
        
        // Find parameter by name
        for (int i = 0; i < parameterNames.length; i++) {
            if (parameterNames[i].equals(paramName)) {
                Object value = parameterValues[i];
                
                // Convert to Long
                if (value instanceof Long) {
                    return (Long) value;
                } else if (value instanceof Integer) {
                    return ((Integer) value).longValue();
                } else if (value instanceof String) {
                    try {
                        return Long.parseLong((String) value);
                    } catch (NumberFormatException e) {
                        log.warn("Cannot parse channelId from String: {}", value);
                    }
                }
                
                log.warn("Parameter '{}' found but has unexpected type: {}", 
                         paramName, value != null ? value.getClass() : "null");
                return null;
            }
        }
        
        log.warn("Parameter '{}' not found in method {}. Available parameters: {}", 
                 paramName, method.getName(), String.join(", ", parameterNames));
        return null;
    }
}
