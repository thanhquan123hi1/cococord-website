package vn.cococord.entity.mysql;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Shop Items - Borders, Effects, Frames, etc.
 */
@Entity
@Table(name = "shop_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ItemCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ItemRarity rarity = ItemRarity.COMMON;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    // Visual assets
    @Column(length = 500)
    private String previewUrl;

    @Column(length = 500)
    private String assetUrl; // CSS/animation file or image

    // For CSS-based items
    @Column(columnDefinition = "TEXT")
    private String cssStyles;

    // For animation effects
    @Column(length = 100)
    private String animationClass;

    // Availability
    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isLimited = false;

    private Integer stockLimit;

    private Integer soldCount;

    private LocalDateTime availableFrom;

    private LocalDateTime availableUntil;

    // Required Nitro tier (null = no requirement)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "required_nitro_tier_id")
    private NitroTier requiredNitroTier;

    @Column(nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum ItemCategory {
        AVATAR_BORDER,      // Viền avatar
        MESSAGE_EFFECT,     // Hiệu ứng tin nhắn
        USER_FRAME,         // Khung user profile
        USER_PANEL_THEME,   // Theme cho user panel
        USER_MENU_THEME,    // Theme cho user menu
        PROFILE_BADGE,      // Huy hiệu profile
        CHAT_BUBBLE,        // Bubble style cho tin nhắn
        NAME_COLOR,         // Màu tên
        NAME_EFFECT,        // Hiệu ứng tên (glow, etc.)
        STICKER_PACK,       // Gói sticker
        EMOJI_PACK          // Gói emoji
    }

    public enum ItemRarity {
        COMMON,
        UNCOMMON,
        RARE,
        EPIC,
        LEGENDARY,
        MYTHIC
    }

    public boolean isAvailable() {
        if (!isActive) return false;
        LocalDateTime now = LocalDateTime.now();
        if (availableFrom != null && now.isBefore(availableFrom)) return false;
        if (availableUntil != null && now.isAfter(availableUntil)) return false;
        if (isLimited && stockLimit != null && soldCount != null && soldCount >= stockLimit) return false;
        return true;
    }
}
