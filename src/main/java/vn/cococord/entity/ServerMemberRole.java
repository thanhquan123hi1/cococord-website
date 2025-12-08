package vn.cococord.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "server_member_roles", uniqueConstraints = @UniqueConstraint(columnNames = {"server_member_id", "role_id"}))
@Data
public class ServerMemberRole {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "server_member_id")
    private ServerMember serverMember;
    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;
}
