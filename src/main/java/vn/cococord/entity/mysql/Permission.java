package vn.cococord.entity.mysql;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "permissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    private String name; // e.g., "MANAGE_SERVER", "KICK_MEMBERS", "BAN_MEMBERS"

    @Column(nullable = false, length = 200)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PermissionCategory category;

    public enum PermissionCategory {
        GENERAL, // MANAGE_SERVER, VIEW_AUDIT_LOG
        MEMBERSHIP, // KICK_MEMBERS, BAN_MEMBERS, MANAGE_NICKNAMES
        CHANNEL, // MANAGE_CHANNELS, MANAGE_WEBHOOKS
        MESSAGE, // SEND_MESSAGES, MANAGE_MESSAGES, MENTION_EVERYONE
        VOICE, // CONNECT, SPEAK, MUTE_MEMBERS, MOVE_MEMBERS
        ROLE // MANAGE_ROLES
    }
}
