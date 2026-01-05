package vn.cococord.entity.mysql;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    private String username;

    @Column(unique = true, nullable = false, length = 150)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(length = 50)
    private String displayName;

    @Column(length = 500)
    private String avatarUrl;

    @Column(length = 500)
    private String bio;

    @Column(length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.OFFLINE;

    @Column(length = 128)
    private String customStatus;

    @Column(length = 10)
    private String customStatusEmoji;

    private LocalDateTime customStatusExpiresAt;

    @Column(length = 500)
    private String bannerUrl;

    @Column(length = 20)
    private String pronouns;

    @Column(length = 20)
    private String theme; // LIGHT, DARK

    @Column(length = 20)
    private String messageDisplay; // COMPACT, COZY

    @Column(nullable = false)
    @Builder.Default
    private Boolean allowFriendRequests = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean allowDirectMessages = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isBanned = false;

    private LocalDateTime bannedAt;

    private LocalDateTime bannedUntil;

    @Column(length = 500)
    private String banReason;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isMuted = false;

    private LocalDateTime mutedUntil;

    @Column(length = 500)
    private String muteReason;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isEmailVerified = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean twoFactorEnabled = false;

    @Column(length = 500)
    private String twoFactorSecret;

    @Column(length = 500)
    private String resetPasswordToken;

    private LocalDateTime resetPasswordExpiry;

    private LocalDateTime lastLogin;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<ServerMember> serverMemberships = new HashSet<>();

    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<FriendRequest> sentFriendRequests = new HashSet<>();

    @OneToMany(mappedBy = "receiver", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<FriendRequest> receivedFriendRequests = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<BlockedUser> blockedUsers = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<UserSession> sessions = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<Notification> notifications = new HashSet<>();

    public enum UserStatus {
        ONLINE, IDLE, DO_NOT_DISTURB, OFFLINE, INVISIBLE
    }

    public enum Role {
        USER, MODERATOR, ADMIN
    }
}
