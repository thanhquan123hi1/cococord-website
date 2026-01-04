package vn.cococord.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminRoleResponse {

    private Long id;
    private String name;
    private String description;
    private String color;
    private List<String> permissions;
    private int userCount;
    private boolean isSystem;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
