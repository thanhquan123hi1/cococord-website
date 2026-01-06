package vn.cococord.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.cococord.entity.mysql.UserNitroSubscription;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserNitroResponse {
    private Long id;
    private Long userId;
    private NitroTierResponse tier;
    private UserNitroSubscription.SubscriptionType subscriptionType;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isActive;
    private Boolean autoRenew;
    private Boolean isExpired;
    private Long daysRemaining;
}
