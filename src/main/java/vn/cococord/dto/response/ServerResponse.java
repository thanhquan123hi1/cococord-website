package vn.cococord.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServerResponse {
    private Long id;
    private String name;
    private String description;
    private String iconUrl;
    private String bannerUrl;
    private Long ownerId;
    private String ownerUsername;
    private Boolean isPublic;
    private Integer maxMembers;
    private Integer memberCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ChannelResponse> channels;
    private List<CategoryResponse> categories;
    private List<RoleResponse> roles;
}
