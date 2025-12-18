package vn.cococord.dto.response;

import java.util.List;
import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReactionResponse {

    private String emoji;
    private String emojiId;
    private Integer count;
    private Set<Long> userIds;
    private List<String> usernames; // For tooltip display
    private Boolean hasReacted; // Current user has reacted
}
