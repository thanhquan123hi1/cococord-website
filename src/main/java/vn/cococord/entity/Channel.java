package vn.cococord.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "channels")
@Data
public class Channel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "server_id")
    private Server server;
    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;
    @Column(nullable = false)
    private String name;
    @Enumerated(EnumType.STRING)
    private ChannelType type = ChannelType.TEXT;
    private String topic;
    private Integer position;
    private boolean isPrivate;
    private LocalDateTime createdAt;
    @PrePersist
    public void prePersist() {
        createdAt = java.time.LocalDateTime.now();
    }
}
