package vn.cococord.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.TextCriteria;
import org.springframework.data.mongodb.core.query.TextQuery;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.request.MessageSearchRequest;
import vn.cococord.dto.response.MessageSearchResponse;
import vn.cococord.entity.mongodb.Message;
import vn.cococord.entity.mysql.Channel;
import vn.cococord.entity.mysql.Server;
import vn.cococord.entity.mysql.User;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.exception.UnauthorizedException;
import vn.cococord.repository.IChannelRepository;
import vn.cococord.repository.IServerMemberRepository;
import vn.cococord.repository.IServerRepository;
import vn.cococord.repository.IUserRepository;
import vn.cococord.service.IChannelService;
import vn.cococord.service.IMessageSearchService;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageSearchServiceImpl implements IMessageSearchService {

    private final MongoTemplate mongoTemplate;
    private final IUserRepository userRepository;
    private final IChannelRepository channelRepository;
    private final IServerRepository serverRepository;
    private final IServerMemberRepository serverMemberRepository;
    private final IChannelService channelService;

    @Override
    public Page<MessageSearchResponse> searchMessages(MessageSearchRequest request, String username) {
        // Validate user exists
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        // Build text search query
        TextCriteria textCriteria = TextCriteria.forDefaultLanguage()
                .matchingAny(request.getKeyword());

        Query query = TextQuery.queryText(textCriteria)
                .sortByScore();

        // Add filters
        List<Criteria> additionalCriteria = new ArrayList<>();

        // Filter by channel (with access check)
        if (request.getChannelId() != null) {
            if (!channelService.canUserAccessChannel(request.getChannelId(), username)) {
                throw new UnauthorizedException("Bạn không có quyền truy cập channel này");
            }
            additionalCriteria.add(Criteria.where("channelId").is(request.getChannelId()));
        }

        // Filter by server (with membership check)
        if (request.getServerId() != null) {
            if (!serverMemberRepository.existsByServerIdAndUserId(request.getServerId(), user.getId())) {
                throw new UnauthorizedException("Bạn không phải thành viên của server này");
            }
            additionalCriteria.add(Criteria.where("serverId").is(request.getServerId()));
        }

        // Filter by user (sender)
        if (request.getUserId() != null) {
            additionalCriteria.add(Criteria.where("userId").is(request.getUserId()));
        }

        // Filter by message type
        if (request.getMessageType() != null && !request.getMessageType().isEmpty()) {
            additionalCriteria.add(Criteria.where("type").is(request.getMessageType()));
        }

        // Filter by attachments
        if (Boolean.TRUE.equals(request.getHasAttachments())) {
            additionalCriteria.add(Criteria.where("attachments").ne(null).not().size(0));
        }

        // Exclude deleted messages
        additionalCriteria.add(Criteria.where("isDeleted").ne(true));

        // Add all criteria to query
        if (!additionalCriteria.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(additionalCriteria.toArray(new Criteria[0])));
        }

        // Pagination
        int page = request.getPage() != null ? request.getPage() : 0;
        int size = request.getSize() != null ? Math.min(request.getSize(), 50) : 20;
        
        // Get total count
        long total = mongoTemplate.count(query, Message.class);

        // Apply pagination
        query.skip((long) page * size).limit(size);

        // Execute query
        List<Message> messages = mongoTemplate.find(query, Message.class);

        // Convert to response with user info
        List<MessageSearchResponse> responses = convertToResponses(messages, request.getKeyword());

        return new PageImpl<>(responses, PageRequest.of(page, size), total);
    }

    @Override
    public Page<MessageSearchResponse> searchInChannel(Long channelId, String keyword, int page, int size, String username) {
        MessageSearchRequest request = MessageSearchRequest.builder()
                .keyword(keyword)
                .channelId(channelId)
                .page(page)
                .size(size)
                .build();
        return searchMessages(request, username);
    }

    @Override
    public Page<MessageSearchResponse> searchInServer(Long serverId, String keyword, int page, int size, String username) {
        MessageSearchRequest request = MessageSearchRequest.builder()
                .keyword(keyword)
                .serverId(serverId)
                .page(page)
                .size(size)
                .build();
        return searchMessages(request, username);
    }

    /**
     * Convert Message entities to search response DTOs with highlighted content
     */
    private List<MessageSearchResponse> convertToResponses(List<Message> messages, String keyword) {
        if (messages.isEmpty()) {
            return new ArrayList<>();
        }

        // Collect channel and server IDs for batch lookup
        List<Long> channelIds = messages.stream()
                .map(Message::getChannelId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());

        List<Long> serverIds = messages.stream()
                .map(Message::getServerId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());

        // Batch fetch channels and servers
        Map<Long, Channel> channelMap = channelRepository.findAllById(channelIds).stream()
                .collect(Collectors.toMap(Channel::getId, c -> c));

        Map<Long, Server> serverMap = serverRepository.findAllById(serverIds).stream()
                .collect(Collectors.toMap(Server::getId, s -> s));

        // Convert messages
        return messages.stream()
                .map(msg -> convertToResponse(msg, keyword, channelMap, serverMap))
                .collect(Collectors.toList());
    }

    /**
     * Convert a single message to search response with highlighted content
     */
    private MessageSearchResponse convertToResponse(Message msg, String keyword, 
            Map<Long, Channel> channelMap, Map<Long, Server> serverMap) {
        
        Channel channel = msg.getChannelId() != null ? channelMap.get(msg.getChannelId()) : null;
        Server server = msg.getServerId() != null ? serverMap.get(msg.getServerId()) : null;

        // Create highlighted content
        String highlightedContent = highlightSearchTerms(msg.getContent(), keyword);

        // Build attachment info
        List<MessageSearchResponse.AttachmentInfo> attachmentInfos = new ArrayList<>();
        if (msg.getAttachments() != null && !msg.getAttachments().isEmpty()) {
            attachmentInfos = msg.getAttachments().stream()
                    .map(att -> MessageSearchResponse.AttachmentInfo.builder()
                            .fileName(att.getFileName())
                            .fileType(att.getFileType())
                            .fileUrl(att.getFileUrl())
                            .build())
                    .collect(Collectors.toList());
        }

        return MessageSearchResponse.builder()
                .id(msg.getId())
                .channelId(msg.getChannelId())
                .channelName(channel != null ? channel.getName() : null)
                .serverId(msg.getServerId())
                .serverName(server != null ? server.getName() : null)
                .userId(msg.getUserId())
                .username(msg.getUsername())
                .displayName(msg.getDisplayName())
                .avatarUrl(msg.getAvatarUrl())
                .content(msg.getContent())
                .highlightedContent(highlightedContent)
                .type(msg.getType() != null ? msg.getType().name() : "TEXT")
                .attachmentCount(msg.getAttachments() != null ? msg.getAttachments().size() : 0)
                .attachments(attachmentInfos)
                .searchScore(msg.getScore())
                .createdAt(msg.getCreatedAt())
                .isEdited(msg.getIsEdited())
                .editedAt(msg.getEditedAt())
                .build();
    }

    /**
     * Highlight search terms in content using <mark> tags
     * Supports case-insensitive and accent-insensitive matching
     */
    private String highlightSearchTerms(String content, String keyword) {
        if (content == null || keyword == null || keyword.isEmpty()) {
            return content;
        }

        // Split keyword into words for multi-word search
        String[] words = keyword.trim().split("\\s+");
        String result = content;

        for (String word : words) {
            if (word.isEmpty()) continue;
            
            // Create case-insensitive pattern
            // This pattern also handles Vietnamese diacritics by matching the base character
            String escapedWord = Pattern.quote(word);
            Pattern pattern = Pattern.compile("(" + escapedWord + ")", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
            Matcher matcher = pattern.matcher(result);
            
            result = matcher.replaceAll("<mark>$1</mark>");
        }

        return result;
    }
}
