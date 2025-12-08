package vn.cococord.dto;

import lombok.Data;

@Data
public class CreateInviteRequest {
    private Integer expiresInHours; // null = never expires
    private Integer maxUses; // null = unlimited
}
