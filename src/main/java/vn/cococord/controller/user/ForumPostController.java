package vn.cococord.controller.user;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.request.AddReactionRequest;
import vn.cococord.dto.request.CreateForumPostRequest;
import vn.cococord.dto.response.ForumPostResponse;
import vn.cococord.dto.response.MessageResponse;
import vn.cococord.entity.mongodb.ForumPost;
import vn.cococord.entity.mongodb.Message;
import vn.cococord.entity.mysql.Channel;
import vn.cococord.entity.mysql.User;
import vn.cococord.exception.BadRequestException;
import vn.cococord.exception.ForbiddenException;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.repository.IChannelRepository;
import vn.cococord.repository.IForumPostRepository;
import vn.cococord.service.IPermissionService;
import vn.cococord.service.IUserService;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class ForumPostController {

    private final IForumPostRepository forumPostRepository;
    private final IChannelRepository channelRepository;
    private final IUserService userService;
    private final IPermissionService permissionService;

    /**
     * Get all posts in a forum channel (displayed as tree)
     */
    @GetMapping("/channels/{channelId}/forum-posts")
    public ResponseEntity<List<ForumPostResponse>> getForumPosts(
            @PathVariable Long channelId,
            Authentication authentication) {

        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found"));

        if (channel.getType() != Channel.ChannelType.FORUM) {
            throw new BadRequestException("Channel is not a forum channel");
        }

        List<ForumPost> posts = forumPostRepository.findByChannelIdOrderByIsPinnedDescCreatedAtDesc(channelId);

        List<ForumPostResponse> response = posts.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Create a new forum post (requires permission)
     */
    @PostMapping("/channels/{channelId}/forum-posts")
    public ResponseEntity<ForumPostResponse> createForumPost(
            @PathVariable Long channelId,
            @Valid @RequestBody CreateForumPostRequest request,
            Authentication authentication) {

        String username = authentication.getName();
        User user = userService.getUserByUsername(username);

        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found"));

        if (channel.getType() != Channel.ChannelType.FORUM) {
            throw new BadRequestException("Channel is not a forum channel");
        }

        // Check if user has permission to post
        // Admin, moderators, or users with SEND_MESSAGES permission can post
        Long serverId = channel.getServer().getId();
        boolean canPost = permissionService.hasPermission(user.getId(), serverId, "SEND_MESSAGES");

        if (!canPost) {
            throw new ForbiddenException("You don't have permission to create posts in this forum");
        }

        // Validate title length
        if (request.getTitle().length() > 25) {
            throw new BadRequestException("Title must not exceed 25 characters");
        }

        // Create post
        ForumPost post = ForumPost.builder()
                .channelId(channelId)
                .serverId(serverId)
                .authorId(user.getId())
                .authorUsername(user.getUsername())
                .authorDisplayName(user.getDisplayName())
                .authorAvatarUrl(user.getAvatarUrl())
                .title(request.getTitle())
                .imageUrl(request.getImageUrl())
                .content(request.getContent())
                .build();

        ForumPost saved = forumPostRepository.save(post);
        log.info("Forum post created by {} in channel {}: {}", username, channelId, saved.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    /**
     * Delete a forum post (author or admin only)
     */
    @DeleteMapping("/forum-posts/{postId}")
    public ResponseEntity<MessageResponse> deleteForumPost(
            @PathVariable String postId,
            Authentication authentication) {

        String username = authentication.getName();
        User user = userService.getUserByUsername(username);

        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Forum post not found"));

        // Check if user is author or has admin permission
        boolean isAuthor = post.getAuthorId().equals(user.getId());
        boolean isAdmin = permissionService.hasPermission(user.getId(), post.getServerId(), "ADMINISTRATOR");

        if (!isAuthor && !isAdmin) {
            throw new ForbiddenException("You don't have permission to delete this post");
        }

        forumPostRepository.delete(post);
        log.info("Forum post {} deleted by {}", postId, username);

        return ResponseEntity.ok(new MessageResponse("Forum post deleted successfully"));
    }

    /**
     * Add reaction to a forum post
     */
    @PostMapping("/forum-posts/{postId}/reactions")
    public ResponseEntity<MessageResponse> addReaction(
            @PathVariable String postId,
            @Valid @RequestBody AddReactionRequest request,
            Authentication authentication) {

        String username = authentication.getName();
        User user = userService.getUserByUsername(username);

        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Forum post not found"));

        // Find or create reaction
        var existingReaction = post.getReactions().stream()
                .filter(r -> r.getEmoji().equals(request.getEmoji()))
                .findFirst();

        if (existingReaction.isPresent()) {
            var reaction = existingReaction.get();
            if (!reaction.getUserIds().contains(user.getId())) {
                reaction.getUserIds().add(user.getId());
                reaction.setCount(reaction.getUserIds().size());
            }
        } else {
            Message.Reaction newReaction = Message.Reaction.builder()
                    .emoji(request.getEmoji())
                    .userIds(new HashSet<>())
                    .count(1)
                    .build();
            newReaction.getUserIds().add(user.getId());
            post.getReactions().add(newReaction);
        }

        forumPostRepository.save(post);

        return ResponseEntity.ok(new MessageResponse("Reaction added"));
    }

    private ForumPostResponse toResponse(ForumPost post) {
        return ForumPostResponse.builder()
                .id(post.getId())
                .channelId(post.getChannelId())
                .serverId(post.getServerId())
                .authorId(post.getAuthorId())
                .authorUsername(post.getAuthorUsername())
                .authorDisplayName(post.getAuthorDisplayName())
                .authorAvatarUrl(post.getAuthorAvatarUrl())
                .title(post.getTitle())
                .imageUrl(post.getImageUrl())
                .content(post.getContent())
                .reactions(post.getReactions())
                .commentCount(post.getCommentCount())
                .isPinned(post.getIsPinned())
                .isLocked(post.getIsLocked())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
