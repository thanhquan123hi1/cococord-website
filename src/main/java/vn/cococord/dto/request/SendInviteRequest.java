package vn.cococord.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendInviteRequest {

    @JsonProperty("recipientId")
    @NotNull(message = "Recipient ID is required")
    private Long recipientId;

    @JsonProperty("serverId")
    @NotNull(message = "Server ID is required")
    private Long serverId;

    @JsonProperty("inviteCode")
    private String inviteCode;
}
