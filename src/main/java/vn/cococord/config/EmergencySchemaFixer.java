package vn.cococord.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * EMERGENCY SCHEMA FIXER - NUCLEAR OPTION
 * 
 * This component DROPS and RECREATES the channel_permissions table
 * to fix severe schema mismatch issues (legacy columns like is_allowed,
 * permission_id).
 * 
 * WARNING: This will DELETE ALL existing channel permission overrides!
 * This is acceptable to unblock the feature.
 * 
 * DELETE THIS FILE after the fix is verified working.
 */
@Component
public class EmergencySchemaFixer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(EmergencySchemaFixer.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        log.warn("╔══════════════════════════════════════════════════════════════╗");
        log.warn("║     EMERGENCY SCHEMA FIXER - NUCLEAR OPTION ACTIVATED        ║");
        log.warn("╚══════════════════════════════════════════════════════════════╝");

        try {
            // STEP 1: DROP the broken table
            log.warn(">>> STEP 1: Dropping channel_permissions table...");
            jdbcTemplate.execute("DROP TABLE IF EXISTS channel_permissions");
            log.info("SUCCESS: Table dropped.");

            // STEP 2: RECREATE with correct schema matching ChannelPermission.java entity
            log.warn(">>> STEP 2: Recreating channel_permissions table with correct schema...");
            String createTableSQL = "CREATE TABLE channel_permissions (" +
                    "  id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "  channel_id BIGINT NOT NULL, " +
                    "  target_type VARCHAR(20) NOT NULL, " + // Maps to @Enumerated(EnumType.STRING)
                    "  target_id BIGINT NOT NULL, " +
                    "  allow_bitmask BIGINT NOT NULL DEFAULT 0, " +
                    "  deny_bitmask BIGINT NOT NULL DEFAULT 0, " +
                    "  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
                    "  CONSTRAINT fk_cp_channel FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE, " +
                    "  CONSTRAINT uk_cp_target UNIQUE (channel_id, target_type, target_id)" +
                    ")";
            jdbcTemplate.execute(createTableSQL);
            log.info("SUCCESS: Table recreated with correct schema.");

            log.warn("╔══════════════════════════════════════════════════════════════╗");
            log.warn("║     SCHEMA FIX COMPLETE - channel_permissions reset!         ║");
            log.warn("║     You can now delete EmergencySchemaFixer.java             ║");
            log.warn("╚══════════════════════════════════════════════════════════════╝");

        } catch (Exception e) {
            log.error("SCHEMA FIX FAILED: " + e.getMessage(), e);
            throw e; // Re-throw to make startup fail visibly
        }
    }
}
