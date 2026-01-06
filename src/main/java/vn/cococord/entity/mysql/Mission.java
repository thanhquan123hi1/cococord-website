package vn.cococord.entity.mysql;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Missions/Tasks system
 * Users complete missions to earn CoCo Credits
 */
@Entity
@Table(name = "missions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MissionCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private MissionType type = MissionType.DAILY;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private MissionDifficulty difficulty = MissionDifficulty.EASY;

    // Reward
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal rewardCredits;

    // Progress tracking
    @Column(nullable = false)
    @Builder.Default
    private Integer requiredCount = 1; // e.g., send 10 messages

    // Task action type for auto-tracking
    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private MissionAction action;

    // Optional: specific target (e.g., specific channel ID)
    private Long targetId;

    @Column(length = 200)
    private String targetName;

    // Icon/visual
    @Column(length = 500)
    private String iconUrl;

    @Column(length = 50)
    private String iconEmoji;

    // Availability
    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    private LocalDateTime availableFrom;

    private LocalDateTime availableUntil;

    // Reset schedule (for daily/weekly missions)
    @Column(length = 20)
    private String resetSchedule; // CRON expression or simple: DAILY, WEEKLY, MONTHLY

    @Column(nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum MissionCategory {
        SOCIAL,         // Friend-related
        CHAT,           // Messaging
        VOICE,          // Voice channel
        SERVER,         // Server activities
        PROFILE,        // Profile customization
        EXPLORATION,    // Discover new features
        LOYALTY,        // Daily login, streaks
        SPECIAL         // Limited-time events
    }

    public enum MissionType {
        DAILY,          // Resets daily
        WEEKLY,         // Resets weekly
        MONTHLY,        // Resets monthly
        ONE_TIME,       // Can only complete once ever
        REPEATABLE      // Can complete multiple times (no reset)
    }

    public enum MissionDifficulty {
        EASY,
        MEDIUM,
        HARD,
        EXPERT
    }

    public enum MissionAction {
        // Chat actions
        SEND_MESSAGE,
        SEND_MESSAGE_WITH_ATTACHMENT,
        REACT_TO_MESSAGE,
        EDIT_MESSAGE,
        PIN_MESSAGE,
        
        // Voice actions
        JOIN_VOICE_CHANNEL,
        SPEND_TIME_IN_VOICE,
        
        // Social actions
        ADD_FRIEND,
        SEND_FRIEND_REQUEST,
        ACCEPT_FRIEND_REQUEST,
        START_DM,
        
        // Server actions
        JOIN_SERVER,
        CREATE_SERVER,
        INVITE_MEMBER,
        CREATE_CHANNEL,
        
        // Profile actions
        UPDATE_AVATAR,
        UPDATE_BANNER,
        UPDATE_BIO,
        UPDATE_STATUS,
        
        // Engagement
        DAILY_LOGIN,
        USE_EMOJI,
        USE_STICKER,
        SHARE_SCREEN,
        
        // Special
        PURCHASE_ITEM,
        SUBSCRIBE_NITRO,
        COMPLETE_PROFILE
    }

    public boolean isAvailable() {
        if (!isActive) return false;
        LocalDateTime now = LocalDateTime.now();
        if (availableFrom != null && now.isBefore(availableFrom)) return false;
        if (availableUntil != null && now.isAfter(availableUntil)) return false;
        return true;
    }
}
