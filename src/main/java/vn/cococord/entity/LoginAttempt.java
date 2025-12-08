package vn.cococord.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Entity
@Table(name = "login_attempts")
@Data
public class LoginAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String ipAddress;

    private boolean success;

    private Instant attemptTime;

    @PrePersist
    public void prePersist() {
        attemptTime = Instant.now();
    }
}
