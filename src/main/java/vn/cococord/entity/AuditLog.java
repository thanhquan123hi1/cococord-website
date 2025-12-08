package vn.cococord.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Entity
@Table(name = "audit_logs")
@Data
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private AuditAction action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "server_id")
    private Server server;

    private String targetType; // USER, SERVER, CHANNEL, MESSAGE, etc.

    private Long targetId;

    private String details; // JSON string with additional info

    private String ipAddress;

    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = Instant.now();
    }

    public enum AuditAction {
        USER_REGISTER, USER_LOGIN, USER_LOGOUT, USER_UPDATE, USER_DELETE,
        SERVER_CREATE, SERVER_UPDATE, SERVER_DELETE,
        CHANNEL_CREATE, CHANNEL_UPDATE, CHANNEL_DELETE,
        MEMBER_JOIN, MEMBER_LEAVE, MEMBER_KICK, MEMBER_BAN, MEMBER_UNBAN,
        ROLE_CREATE, ROLE_UPDATE, ROLE_DELETE, ROLE_ASSIGN, ROLE_REMOVE,
        MESSAGE_DELETE, MESSAGE_EDIT,
        INVITE_CREATE, INVITE_DELETE,
        ADMIN_BAN_USER, ADMIN_UNBAN_USER
    }
}
