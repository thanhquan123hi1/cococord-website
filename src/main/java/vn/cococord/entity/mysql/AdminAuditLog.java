package vn.cococord.entity.mysql;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Admin-level audit log for tracking system-wide administrative actions.
 * Different from the server-level AuditLog which tracks per-server actions.
 */
@Entity
@Table(name = "admin_audit_logs", indexes = {
        @Index(name = "idx_admin_audit_action", columnList = "actionType"),
        @Index(name = "idx_admin_audit_actor", columnList = "actor_id"),
        @Index(name = "idx_admin_audit_created", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AdminActionType actionType;

    @Column(nullable = false, length = 1000)
    private String description;

    // Target entity info
    @Column(length = 50)
    private String targetType; // USER, SERVER, REPORT, SETTINGS, etc.

    private Long targetId;

    @Column(length = 200)
    private String targetName;

    @Column(columnDefinition = "TEXT")
    private String changes; // JSON format for before/after data

    @Column(length = 45)
    private String ipAddress;

    @Column(length = 500)
    private String userAgent;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum AdminActionType {
        // User management
        USER_VIEW, USER_CREATE, USER_BAN, USER_UNBAN, USER_MUTE, USER_UNMUTE,
        USER_ROLE_CHANGE, USER_DELETE,

        // Server management
        SERVER_VIEW, SERVER_LOCK, SERVER_UNLOCK, SERVER_DELETE, SERVER_TRANSFER,

        // Report management
        REPORT_VIEW, REPORT_RESOLVE, REPORT_REJECT,

        // Message management
        MESSAGE_VIEW, MESSAGE_DELETE,

        // Settings management
        SETTINGS_VIEW, SETTINGS_UPDATE,

        // System roles
        ROLE_CREATE, ROLE_UPDATE, ROLE_DELETE,

        // Authentication
        ADMIN_LOGIN, ADMIN_LOGOUT
    }
}
