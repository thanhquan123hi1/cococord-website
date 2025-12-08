package vn.cococord.dto;

import lombok.Data;
import java.util.List;

@Data
public class RoleDto {
    private Long id;
    private String name;
    private String color;
    private int position;
    private List<String> permissions;
    private boolean isDefault;
    private int memberCount;
}
