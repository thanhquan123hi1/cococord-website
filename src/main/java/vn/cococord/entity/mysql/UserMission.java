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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * User's mission progress tracking
 */
@Entity
@Table(name = "user_missions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "mission_id", "period_key"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserMission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mission_id", nullable = false)
    private Mission mission;

    // Period key for daily/weekly/monthly reset (e.g., "2026-01-06" for daily)
    @Column(length = 20)
    private String periodKey;

    @Column(nullable = false)
    @Builder.Default
    private Integer currentProgress = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private MissionStatus status = MissionStatus.IN_PROGRESS;

    @Column(precision = 15, scale = 2)
    private BigDecimal rewardClaimed;

    private LocalDateTime completedAt;

    private LocalDateTime rewardClaimedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime startedAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum MissionStatus {
        IN_PROGRESS,    // Đang thực hiện
        COMPLETED,      // Hoàn thành nhưng chưa nhận thưởng
        CLAIMED         // Đã nhận thưởng
    }

    public boolean isComplete() {
        return currentProgress >= mission.getRequiredCount();
    }

    public void incrementProgress() {
        this.currentProgress++;
        if (isComplete() && status == MissionStatus.IN_PROGRESS) {
            this.status = MissionStatus.COMPLETED;
            this.completedAt = LocalDateTime.now();
        }
    }

    public void incrementProgress(int amount) {
        this.currentProgress += amount;
        if (isComplete() && status == MissionStatus.IN_PROGRESS) {
            this.status = MissionStatus.COMPLETED;
            this.completedAt = LocalDateTime.now();
        }
    }

    public int getProgressPercent() {
        if (mission.getRequiredCount() == 0) return 100;
        return Math.min(100, (int) ((currentProgress * 100.0) / mission.getRequiredCount()));
    }
}
