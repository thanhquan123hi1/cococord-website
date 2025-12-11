package vn.cococord.entity.mysql;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "server_id", nullable = false)
    private Server server;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // Who performed the action

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AuditActionType actionType;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(columnDefinition = "TEXT")
    private String changes; // JSON format for before/after data

    @Column(length = 45)
    private String ipAddress;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum AuditActionType {
        // Server actions
        SERVER_UPDATE, SERVER_DELETE,

        // Member actions
        MEMBER_JOIN, MEMBER_LEAVE, MEMBER_KICK, MEMBER_BAN, MEMBER_UNBAN,

        // Role actions
        ROLE_CREATE, ROLE_UPDATE, ROLE_DELETE, ROLE_ASSIGN, ROLE_REMOVE,

        // Channel actions
        CHANNEL_CREATE, CHANNEL_UPDATE, CHANNEL_DELETE,

        // Message actions
        MESSAGE_DELETE, MESSAGE_BULK_DELETE,

        // Permission actions
        PERMISSION_UPDATE,

        // Invite actions
        INVITE_CREATE, INVITE_DELETE
    }
}
