package vn.cococord.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformStatsResponse {
    private long totalChannels;
    private long totalServers;
    private long activeServers;
    private long suspendedServers;
}
