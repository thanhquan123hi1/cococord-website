package vn.cococord.service;

import org.springframework.data.domain.Page;

import vn.cococord.dto.request.MessageSearchRequest;
import vn.cococord.dto.response.MessageSearchResponse;

/**
 * Service interface for message search functionality
 */
public interface IMessageSearchService {
    
    /**
     * Search messages using MongoDB text search
     * @param request Search request containing keyword, filters, and pagination
     * @param username The username of the user performing the search (for access control)
     * @return Page of search results with user info
     */
    Page<MessageSearchResponse> searchMessages(MessageSearchRequest request, String username);
    
    /**
     * Search messages in a specific channel
     * @param channelId The channel ID
     * @param keyword Search keyword
     * @param page Page number
     * @param size Page size
     * @param username The username of the user performing the search
     * @return Page of search results
     */
    Page<MessageSearchResponse> searchInChannel(Long channelId, String keyword, int page, int size, String username);
    
    /**
     * Search messages in all channels of a server
     * @param serverId The server ID
     * @param keyword Search keyword
     * @param page Page number
     * @param size Page size
     * @param username The username of the user performing the search
     * @return Page of search results
     */
    Page<MessageSearchResponse> searchInServer(Long serverId, String keyword, int page, int size, String username);
}
