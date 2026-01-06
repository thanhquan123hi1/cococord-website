package vn.cococord.exception;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.response.MessageResponse;

@RestControllerAdvice(annotations = RestController.class)
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handle validation errors
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "Dữ liệu không hợp lệ");
        response.put("errors", errors);

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Handle bad request exceptions
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<MessageResponse> handleBadRequestException(BadRequestException ex) {
        log.error("Bad request error: {}", ex.getMessage());
        return ResponseEntity
                .badRequest()
                .body(MessageResponse.error(ex.getMessage()));
    }

    /**
     * Handle unauthorized exceptions
     */
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<MessageResponse> handleUnauthorizedException(UnauthorizedException ex) {
        log.error("Unauthorized error: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(MessageResponse.error(ex.getMessage()));
    }

    /**
     * Handle bad credentials (wrong password)
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<MessageResponse> handleBadCredentialsException(BadCredentialsException ex) {
        log.error("Bad credentials: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(MessageResponse.error("Tên đăng nhập hoặc mật khẩu không đúng"));
    }

    /**
     * Handle disabled account (isActive = false)
     */
    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<MessageResponse> handleDisabledException(DisabledException ex) {
        log.error("Account disabled: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(MessageResponse.error("Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ."));
    }

    /**
     * Handle locked account (isBanned = true)
     */
    @ExceptionHandler(LockedException.class)
    public ResponseEntity<MessageResponse> handleLockedException(LockedException ex) {
        log.error("Account locked: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(MessageResponse.error("Tài khoản đã bị cấm. Vui lòng liên hệ hỗ trợ."));
    }

    /**
     * Handle forbidden exceptions (including server lock/suspend)
     */
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Map<String, Object>> handleForbiddenException(ForbiddenException ex) {
        String message = ex.getMessage();
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);

        // Handle server status errors with structured response
        if (message != null && message.startsWith("SERVER_SUSPENDED:")) {
            response.put("code", "SERVER_SUSPENDED");
            response.put("message", message.substring("SERVER_SUSPENDED:".length()));
            log.warn("Access denied - server suspended: {}", message);
        } else if (message != null && message.startsWith("SERVER_LOCKED:")) {
            String details = message.substring("SERVER_LOCKED:".length());
            String reason = details;
            String until = null;

            if (details.contains("|UNTIL:")) {
                String[] parts = details.split("\\|UNTIL:");
                reason = parts[0];
                until = parts.length > 1 ? parts[1] : null;
            }

            response.put("code", "SERVER_LOCKED");
            response.put("message", reason);
            if (until != null) {
                response.put("lockedUntil", until);
            }
            log.warn("Access denied - server locked: {}", message);
        } else {
            response.put("code", "FORBIDDEN");
            response.put("message", message != null ? message : "Access denied");
            log.warn("Forbidden: {}", message);
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    /**
     * Handle user not found
     */
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<MessageResponse> handleUsernameNotFoundException(UsernameNotFoundException ex) {
        log.error("User not found: {}", ex.getMessage());
        String message = ex.getMessage();
        if (message != null && message.contains("deactivated")) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(MessageResponse.error("Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ."));
        }
        if (message != null && message.contains("banned")) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(MessageResponse.error("Tài khoản đã bị cấm. Vui lòng liên hệ hỗ trợ."));
        }
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(MessageResponse.error("Tên đăng nhập hoặc mật khẩu không đúng"));
    }

    /**
     * Handle resource not found exceptions
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<MessageResponse> handleResourceNotFoundException(ResourceNotFoundException ex) {
        log.error("Resource not found: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(MessageResponse.error(ex.getMessage()));
    }

    /**
     * Handle all other exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<MessageResponse> handleGlobalException(Exception ex) {
        log.error("Unexpected error occurred", ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(MessageResponse.error("Error: " + ex.getClass().getSimpleName() + ": " + ex.getMessage()));
    }
}
