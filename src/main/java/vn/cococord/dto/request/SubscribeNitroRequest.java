package vn.cococord.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.cococord.entity.mysql.UserNitroSubscription;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscribeNitroRequest {
    @NotBlank(message = "Tier code is required")
    private String tierCode;
    
    @NotNull(message = "Subscription type is required")
    private UserNitroSubscription.SubscriptionType subscriptionType;
    
    private Boolean autoRenew;
}
