package vn.cococord.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "server_members", uniqueConstraints = @UniqueConstraint(columnNames = {"server_id", "user_id"}))
@Data
public class ServerMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "server_id")
    private Server server;
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    private String nickname;
    private LocalDateTime joinedAt;
    private boolean isMuted;
    private boolean isDeafened;
    @Enumerated(EnumType.STRING)
    private MemberStatus status = MemberStatus.NORMAL;
    @PrePersist
    public void prePersist() {
        joinedAt = LocalDateTime.now();
    }
}
