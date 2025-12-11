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
public class DMGroupResponse {
    private Long id;
    private String name;
    private Long ownerId;
    private String ownerUsername;
    private Boolean isGroup;
    private String iconUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<DMGroupMemberResponse> members;
}
