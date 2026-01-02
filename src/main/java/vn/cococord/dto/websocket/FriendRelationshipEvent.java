package vn.cococord.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FriendRelationshipEvent {
    /**
     * Event action, e.g. REQUEST_SENT, REQUEST_ACCEPTED, REQUEST_DECLINED,
     * REQUEST_CANCELLED,
     * FRIEND_REMOVED, USER_BLOCKED, USER_UNBLOCKED.
     */
    private String action;

    /**
     * Relationship status from the receiver's perspective.
     * Examples: FRIEND, INCOMING_REQUEST, OUTGOING_REQUEST, BLOCKED, NONE.
     */
    private String relationshipStatus;

    /**
     * The other user involved in this relationship.
     */
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;

    /**
     * Friend request id when relevant (pending requests).
     */
    private Long requestId;
}
