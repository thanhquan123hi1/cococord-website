package vn.cococord.aspect;

import java.lang.reflect.Method;
import java.time.LocalDateTime;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.annotation.CheckServerStatus;
import vn.cococord.entity.mysql.Channel;
import vn.cococord.entity.mysql.Server;
import vn.cococord.exception.ForbiddenException;
import vn.cococord.repository.IChannelRepository;
import vn.cococord.repository.IServerRepository;

/**
 * AOP Aspect for checking server lock/suspend status before executing methods.
 * 
 * Server Status Behavior:
 * - ACTIVE: Full access
 * - LOCKED: Read-only (can view messages, members) but cannot write (send
 * messages, create channels)
 * - SUSPENDED: No access at all - user cannot interact with the server
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
@Order(0) // Execute before PermissionAspect (which has Order 1)
@SuppressWarnings("null")
public class ServerStatusAspect {

    private final IServerRepository serverRepository;
    private final IChannelRepository channelRepository;

    /**
     * Check server status before method execution
     */
    @Around("@annotation(checkServerStatus)")
    public Object checkServerStatus(ProceedingJoinPoint joinPoint, CheckServerStatus checkServerStatus)
            throws Throwable {
        Long serverId = extractServerId(joinPoint, checkServerStatus);

        if (serverId == null) {
            // If we can't determine the server, proceed (let other checks handle it)
            log.debug("Could not determine serverId for server status check, proceeding...");
            return joinPoint.proceed();
        }

        Server server = serverRepository.findById(serverId).orElse(null);
        if (server == null) {
            // Server not found, let the method handle it
            return joinPoint.proceed();
        }

        // Check if server is suspended
        if (Boolean.TRUE.equals(server.getIsSuspended())) {
            // Check if suspension has expired
            if (server.getSuspendedUntil() != null && LocalDateTime.now().isAfter(server.getSuspendedUntil())) {
                // Suspension expired, auto-unsuspend (but don't save here, let scheduled task
                // handle it)
                log.info("Server {} suspension expired, but blocking access until admin unsuspends", serverId);
            }

            log.warn("Access denied to suspended server {}", serverId);
            throw new ForbiddenException("SERVER_SUSPENDED:" +
                    (server.getSuspendReason() != null ? server.getSuspendReason() : "Server is suspended"));
        }

        // Check if server is locked
        if (Boolean.TRUE.equals(server.getIsLocked())) {
            // Check if lock has expired
            if (server.getLockedUntil() != null && LocalDateTime.now().isAfter(server.getLockedUntil())) {
                // Lock expired, auto-unlock (but don't save here, let scheduled task handle it)
                log.info("Server {} lock expired, but blocking write access until admin unlocks", serverId);
            }

            // If allowReadWhenLocked is true, proceed (read operation)
            if (checkServerStatus.allowReadWhenLocked()) {
                log.debug("Server {} is locked, allowing read-only access", serverId);
                return joinPoint.proceed();
            }

            // Block write operations
            log.warn("Write access denied to locked server {}", serverId);
            throw new ForbiddenException("SERVER_LOCKED:" +
                    (server.getLockReason() != null ? server.getLockReason() : "Server is locked") +
                    (server.getLockedUntil() != null ? "|UNTIL:" + server.getLockedUntil().toString() : ""));
        }

        // Server is active, proceed
        return joinPoint.proceed();
    }

    /**
     * Extract server ID from method parameters or resolve from channel
     */
    private Long extractServerId(ProceedingJoinPoint joinPoint, CheckServerStatus annotation) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Object[] args = joinPoint.getArgs();
        String[] parameterNames = signature.getParameterNames();

        // First, try to find parameter by serverIdParam name
        String serverIdParam = annotation.serverIdParam();
        for (int i = 0; i < parameterNames.length; i++) {
            if (serverIdParam.equals(parameterNames[i]) && args[i] != null) {
                return convertToLong(args[i]);
            }
        }

        // Try path variable from HTTP request for serverId
        Long serverId = extractServerIdFromRequest();
        if (serverId != null) {
            return serverId;
        }

        // Try to resolve from channelId
        String channelIdParam = annotation.channelIdParam();
        Long channelId = null;

        for (int i = 0; i < parameterNames.length; i++) {
            if (channelIdParam.equals(parameterNames[i]) && args[i] != null) {
                channelId = convertToLong(args[i]);
                break;
            }
        }

        // Try to find channelId from request if not in params
        if (channelId == null) {
            channelId = extractChannelIdFromRequest();
        }

        // If we have channelId, resolve serverId
        if (channelId != null) {
            Channel channel = channelRepository.findById(channelId).orElse(null);
            if (channel != null && channel.getServer() != null) {
                return channel.getServer().getId();
            }
        }

        // Try to find from DTO parameter
        for (Object arg : args) {
            if (arg != null) {
                // Try getServerId()
                Long fromDto = extractFromDto(arg, "getServerId");
                if (fromDto != null)
                    return fromDto;

                // Try getChannelId() and resolve
                Long dtoChannelId = extractFromDto(arg, "getChannelId");
                if (dtoChannelId != null) {
                    Channel channel = channelRepository.findById(dtoChannelId).orElse(null);
                    if (channel != null && channel.getServer() != null) {
                        return channel.getServer().getId();
                    }
                }
            }
        }

        return null;
    }

    private Long extractServerIdFromRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null)
            return null;

        HttpServletRequest request = attributes.getRequest();
        String uri = request.getRequestURI();

        // Try to extract serverId from URL patterns like /api/servers/{serverId}/...
        String[] parts = uri.split("/");
        for (int i = 0; i < parts.length - 1; i++) {
            if ("servers".equals(parts[i]) && i + 1 < parts.length) {
                try {
                    return Long.parseLong(parts[i + 1]);
                } catch (NumberFormatException ignored) {
                    // Not a number, continue
                }
            }
        }

        // Check request parameters
        String serverIdParam = request.getParameter("serverId");
        if (serverIdParam != null) {
            try {
                return Long.parseLong(serverIdParam);
            } catch (NumberFormatException ignored) {
            }
        }

        return null;
    }

    private Long extractChannelIdFromRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null)
            return null;

        HttpServletRequest request = attributes.getRequest();
        String uri = request.getRequestURI();

        // Try to extract channelId from URL patterns like /api/channels/{channelId}/...
        // or /api/messages/channel/{channelId}
        String[] parts = uri.split("/");
        for (int i = 0; i < parts.length - 1; i++) {
            if (("channels".equals(parts[i]) || "channel".equals(parts[i])) && i + 1 < parts.length) {
                try {
                    return Long.parseLong(parts[i + 1]);
                } catch (NumberFormatException ignored) {
                }
            }
        }

        // Check request parameters
        String channelIdParam = request.getParameter("channelId");
        if (channelIdParam != null) {
            try {
                return Long.parseLong(channelIdParam);
            } catch (NumberFormatException ignored) {
            }
        }

        return null;
    }

    private Long extractFromDto(Object arg, String methodName) {
        try {
            Method method = arg.getClass().getMethod(methodName);
            Object result = method.invoke(arg);
            if (result != null) {
                return convertToLong(result);
            }
        } catch (NoSuchMethodException ignored) {
        } catch (ReflectiveOperationException e) {
            log.warn("Error extracting {} from argument: {}", methodName, e.getMessage());
        }
        return null;
    }

    private Long convertToLong(Object value) {
        if (value instanceof Long longValue) {
            return longValue;
        } else if (value instanceof Integer intValue) {
            return intValue.longValue();
        } else if (value instanceof String strValue) {
            try {
                return Long.parseLong(strValue);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }
}
