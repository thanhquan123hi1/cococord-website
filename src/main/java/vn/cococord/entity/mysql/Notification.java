package vn.cococord.entity.mysql;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(length = 500)
    private String link; // URL to navigate when clicked

    @Column(nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime readAt;

    // Additional metadata (JSON format)
    @Column(columnDefinition = "TEXT")
    private String metadata;

    public enum NotificationType {
        FRIEND_REQUEST,
        FRIEND_ACCEPTED,
        SERVER_INVITE,
        SERVER_KICKED,
        SERVER_BANNED,
        MENTION,
        REPLY,
        ROLE_ASSIGNED,
        SYSTEM
    }
}
