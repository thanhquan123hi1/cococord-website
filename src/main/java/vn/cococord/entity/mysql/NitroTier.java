package vn.cococord.entity.mysql;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * Nitro Subscription Tiers
 * Discord-like subscription system with multiple tiers
 */
@Entity
@Table(name = "nitro_tiers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NitroTier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code; // BASIC, PLUS, PRO, PRO_PLUS, PRO_PLUS_PLUS

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(length = 500)
    private String badgeUrl;

    @Column(length = 500)
    private String bannerUrl;

    // Pricing in CoCo Credits
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal monthlyPrice;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal yearlyPrice;

    // Features as JSON or comma-separated
    @Column(columnDefinition = "TEXT")
    private String features; // JSON array of features

    // Perks
    @Column(nullable = false)
    @Builder.Default
    private Integer maxFileUploadMB = 8;

    @Column(nullable = false)
    @Builder.Default
    private Boolean customEmoji = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean animatedAvatar = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean customBanner = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean hdVideoStreaming = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean serverBoosts = false;

    @Column(nullable = false)
    @Builder.Default
    private Integer boostCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer profileThemes = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean exclusiveStickers = false;

    @Column(nullable = false)
    @Builder.Default
    private Integer discountPercent = 0; // Shop discount

    @Column(nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
