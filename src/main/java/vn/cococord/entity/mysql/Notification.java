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
        // Friend-related notifications
        FRIEND_REQUEST, // Nhận lời mời kết bạn
        FRIEND_ACCEPTED, // Lời mời kết bạn được chấp nhận
        FRIEND_REMOVED, // Bị xóa bạn

        // Direct message notifications
        NEW_DIRECT_MESSAGE, // Tin nhắn mới trong DM
        NEW_GROUP_DM, // Được thêm vào nhóm DM mới
        REMOVED_FROM_GROUP_DM, // Bị xóa khỏi nhóm DM

        // Server-related notifications
        SERVER_INVITE, // Nhận lời mời vào server
        SERVER_KICKED, // Bị kick khỏi server
        SERVER_BANNED, // Bị ban khỏi server

        // Mention & replies
        MENTION, // Được @ trong tin nhắn
        REPLY, // Có người reply tin nhắn

        // Role & System
        ROLE_ASSIGNED, // Được gán role mới
        SYSTEM // Thông báo từ hệ thống
    }
}
