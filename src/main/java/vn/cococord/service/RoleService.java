package vn.cococord.service;

import vn.cococord.dto.RoleDto;
import vn.cococord.dto.CreateRoleRequest;
import vn.cococord.entity.*;
import vn.cococord.repository.RoleRepository;
import vn.cococord.repository.RolePermissionRepository;
import vn.cococord.repository.PermissionRepository;
import vn.cococord.repository.ServerMemberRoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoleService {

    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PermissionRepository permissionRepository;
    private final ServerMemberRoleRepository serverMemberRoleRepository;

    public RoleService(RoleRepository roleRepository,
            RolePermissionRepository rolePermissionRepository,
            PermissionRepository permissionRepository,
            ServerMemberRoleRepository serverMemberRoleRepository) {
        this.roleRepository = roleRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.permissionRepository = permissionRepository;
        this.serverMemberRoleRepository = serverMemberRoleRepository;
    }

    public Role createDefaultRole(Server server) {
        Role role = new Role();
        role.setServer(server);
        role.setName("@everyone");
        role.setColor(0x99AAB5);
        role.setPosition(0);
        role.setDefault(true);
        return roleRepository.save(role);
    }

    public Role createRole(Server server, CreateRoleRequest request) {
        Role role = new Role();
        role.setServer(server);
        role.setName(request.getName());
        role.setColor(request.getColor() != null ? parseColor(request.getColor()) : 0x99AAB5);
        role.setPosition(getNextPosition(server));
        role.setDefault(false);

        role = roleRepository.save(role);

        // Add permissions
        if (request.getPermissions() != null) {
            for (String permName : request.getPermissions()) {
                final Role savedRole = role;
                permissionRepository.findByName(permName).ifPresent(permission -> {
                    RolePermission rp = new RolePermission();
                    rp.setRole(savedRole);
                    rp.setPermission(permission);
                    rolePermissionRepository.save(rp);
                });
            }
        }

        return role;
    }

    public Role updateRole(Long roleId, CreateRoleRequest request) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        if (request.getName() != null) {
            role.setName(request.getName());
        }
        if (request.getColor() != null) {
            role.setColor(parseColor(request.getColor()));
        }

        // Update permissions
        if (request.getPermissions() != null) {
            rolePermissionRepository.deleteByRole(role);
            for (String permName : request.getPermissions()) {
                final Role savedRole = role;
                permissionRepository.findByName(permName).ifPresent(permission -> {
                    RolePermission rp = new RolePermission();
                    rp.setRole(savedRole);
                    rp.setPermission(permission);
                    rolePermissionRepository.save(rp);
                });
            }
        }

        return roleRepository.save(role);
    }

    public void deleteRole(Long roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        if (role.isDefault()) {
            throw new RuntimeException("Cannot delete the default role");
        }

        rolePermissionRepository.deleteByRole(role);
        serverMemberRoleRepository.deleteByRole(role);
        roleRepository.delete(role);
    }

    public void assignRoleToMember(ServerMember member, Role role) {
        if (!member.getServer().getId().equals(role.getServer().getId())) {
            throw new RuntimeException("Role does not belong to this server");
        }

        if (serverMemberRoleRepository.existsByServerMemberAndRole(member, role)) {
            return; // Already has role
        }

        ServerMemberRole memberRole = new ServerMemberRole();
        memberRole.setServerMember(member);
        memberRole.setRole(role);
        serverMemberRoleRepository.save(memberRole);
    }

    public void removeRoleFromMember(ServerMember member, Role role) {
        serverMemberRoleRepository.deleteByServerMemberAndRole(member, role);
    }

    public List<RoleDto> getServerRoles(Server server) {
        return roleRepository.findByServerOrderByPositionDesc(server).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public boolean hasPermission(ServerMember member, String permissionName) {
        List<ServerMemberRole> memberRoles = serverMemberRoleRepository.findByServerMember(member);

        for (ServerMemberRole mr : memberRoles) {
            List<RolePermission> rolePerms = rolePermissionRepository.findByRole(mr.getRole());
            for (RolePermission rp : rolePerms) {
                if (rp.getPermission().getName().equals(permissionName)) {
                    return true;
                }
            }
        }

        return false;
    }

    private int getNextPosition(Server server) {
        return roleRepository.findByServerOrderByPositionDesc(server).stream()
                .findFirst()
                .map(r -> r.getPosition() + 1)
                .orElse(1);
    }

    private Integer parseColor(String colorStr) {
        if (colorStr == null)
            return 0x99AAB5;
        try {
            if (colorStr.startsWith("#")) {
                return Integer.parseInt(colorStr.substring(1), 16);
            }
            return Integer.parseInt(colorStr, 16);
        } catch (NumberFormatException e) {
            return 0x99AAB5;
        }
    }

    private String colorToHex(Integer color) {
        if (color == null)
            return "#99AAB5";
        return String.format("#%06X", color);
    }

    public RoleDto toDto(Role role) {
        RoleDto dto = new RoleDto();
        dto.setId(role.getId());
        dto.setName(role.getName());
        dto.setColor(colorToHex(role.getColor()));
        dto.setPosition(role.getPosition());
        dto.setDefault(role.isDefault());

        List<String> permissions = rolePermissionRepository.findByRole(role).stream()
                .map(rp -> rp.getPermission().getName())
                .collect(Collectors.toList());
        dto.setPermissions(permissions);

        dto.setMemberCount((int) serverMemberRoleRepository.countByRole(role));

        return dto;
    }
}
