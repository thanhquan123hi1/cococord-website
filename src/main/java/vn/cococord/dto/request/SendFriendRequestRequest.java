package vn.cococord.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendFriendRequestRequest {

    @NotNull(message = "User ID is required")
    private Long receiverUserId;
}
