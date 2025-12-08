package vn.cococord.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Entity
@Table(name = "server_invites")
@Data
public class ServerInvite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "server_id", nullable = false)
    private Server server;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    private Instant expiryDate;

    private Integer maxUses;

    private int uses = 0;

    private boolean active = true;

    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = Instant.now();
    }

    public boolean isValid() {
        if (!active)
            return false;
        if (expiryDate != null && Instant.now().isAfter(expiryDate))
            return false;
        if (maxUses != null && uses >= maxUses)
            return false;
        return true;
    }
}
