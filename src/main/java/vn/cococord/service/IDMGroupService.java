package vn.cococord.service;

import java.util.List;

import vn.cococord.dto.request.CreateDMGroupRequest;
import vn.cococord.dto.response.DMGroupResponse;

/**
 * Service interface for Direct Message Group management
 */
public interface IDMGroupService {

    /**
     * Get all DM groups for a user
     */
    List<DMGroupResponse> getDMGroupsForUser(String username);

    /**
     * Create a new DM group (1-1 or group)
     */
    DMGroupResponse createDMGroup(CreateDMGroupRequest request, String username);

    /**
     * Get DM group by ID
     */
    DMGroupResponse getDMGroup(Long groupId, String username);

    /**
     * Leave or delete a DM group
     */
    void leaveDMGroup(Long groupId, String username);

    /**
     * Add a member to a group DM
     */
    void addMemberToDMGroup(Long groupId, Long userId, String username);

    /**
     * Remove a member from a group DM
     */
    void removeMemberFromDMGroup(Long groupId, Long userId, String username);

    /**
     * Get or create a 1-1 DM with another user
     */
    DMGroupResponse getOrCreateOneToOneDM(Long targetUserId, String username);
}
