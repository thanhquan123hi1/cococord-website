package vn.cococord.service;

import vn.cococord.entity.LoginAttempt;
import vn.cococord.repository.LoginAttemptRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@Transactional
public class LoginAttemptService {

    @Value("${app.security.max-login-attempts:5}")
    private int maxAttempts;

    @Value("${app.security.lockout-duration-minutes:15}")
    private int lockoutDurationMinutes;

    private final LoginAttemptRepository loginAttemptRepository;

    public LoginAttemptService(LoginAttemptRepository loginAttemptRepository) {
        this.loginAttemptRepository = loginAttemptRepository;
    }

    public void recordLoginAttempt(String username, String ipAddress, boolean success) {
        LoginAttempt attempt = new LoginAttempt();
        attempt.setUsername(username);
        attempt.setIpAddress(ipAddress);
        attempt.setSuccess(success);
        loginAttemptRepository.save(attempt);
    }

    public boolean isBlocked(String username) {
        Instant cutoffTime = Instant.now().minus(lockoutDurationMinutes, ChronoUnit.MINUTES);
        long failedAttempts = loginAttemptRepository.countFailedAttempts(username, cutoffTime);
        return failedAttempts >= maxAttempts;
    }

    public boolean isIpBlocked(String ipAddress) {
        Instant cutoffTime = Instant.now().minus(lockoutDurationMinutes, ChronoUnit.MINUTES);
        long failedAttempts = loginAttemptRepository.countFailedAttemptsByIp(ipAddress, cutoffTime);
        return failedAttempts >= maxAttempts * 3; // More lenient for IP blocking
    }

    public int getRemainingAttempts(String username) {
        Instant cutoffTime = Instant.now().minus(lockoutDurationMinutes, ChronoUnit.MINUTES);
        long failedAttempts = loginAttemptRepository.countFailedAttempts(username, cutoffTime);
        return Math.max(0, maxAttempts - (int) failedAttempts);
    }
}
