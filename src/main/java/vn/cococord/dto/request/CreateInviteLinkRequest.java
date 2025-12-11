package vn.cococord.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInviteLinkRequest {

    private Long channelId; // null = general server invite

    @Builder.Default
    private Integer maxUses = 0; // 0 = unlimited

    private Integer expiresInDays; // null = never expires
}
