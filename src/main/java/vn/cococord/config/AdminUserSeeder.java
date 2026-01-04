package vn.cococord.config;

import lombok.RequiredArgsConstructor;
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

    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_EMAIL = "admin@cococord.local";
    private static final String ADMIN_PASSWORD = "admin123";

    private final IUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        User admin = userRepository.findByUsernameOrEmail(ADMIN_USERNAME, ADMIN_EMAIL)
                .orElseGet(() -> User.builder()
                        .username(ADMIN_USERNAME)
                        .email(ADMIN_EMAIL)
                        .displayName("Administrator")
                        .password(passwordEncoder.encode(ADMIN_PASSWORD))
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
