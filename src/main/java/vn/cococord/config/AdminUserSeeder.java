package vn.cococord.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.cococord.entity.mysql.User;
import vn.cococord.repository.IUserRepository;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.admin.enabled", havingValue = "true", matchIfMissing = true)
public class AdminUserSeeder implements ApplicationRunner {

    @Value("${ADMIN_USERNAME:admin}")
    private String adminUsername;

    @Value("${ADMIN_EMAIL:admin@cococord.local}")
    private String adminEmail;

    @Value("${ADMIN_PASSWORD:admin123}")
    private String adminPassword;

    private final IUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        User admin = userRepository.findByUsernameOrEmail(adminUsername, adminEmail)
                .orElseGet(() -> User.builder()
                        .username(adminUsername)
                        .email(adminEmail)
                        .displayName("Administrator")
                        .password(passwordEncoder.encode(adminPassword))
                        .role(User.Role.ADMIN)
                        .isActive(true)
                        .isBanned(false)
                        .isEmailVerified(true)
                        .status(User.UserStatus.OFFLINE)
                        .build());

        boolean changed = false;

        if (admin.getRole() != User.Role.ADMIN) {
            admin.setRole(User.Role.ADMIN);
            changed = true;
        }
        if (admin.getIsActive() == null || !admin.getIsActive()) {
            admin.setIsActive(true);
            changed = true;
        }
        if (admin.getIsBanned() == null || admin.getIsBanned()) {
            admin.setIsBanned(false);
            changed = true;
        }
        if (admin.getIsEmailVerified() == null || !admin.getIsEmailVerified()) {
            admin.setIsEmailVerified(true);
            changed = true;
        }

        // If we just created it, persist; otherwise persist only if we adjusted
        // role/flags.
        if (admin.getId() == null) {
            userRepository.save(admin);
        } else if (changed) {
            userRepository.save(admin);
        }
    }
}
