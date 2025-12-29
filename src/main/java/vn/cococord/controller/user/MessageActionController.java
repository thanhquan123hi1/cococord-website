package vn.cococord.controller.user;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.request.AddReactionRequest;
import vn.cococord.dto.response.FileUploadResponse;
import vn.cococord.dto.response.MessageResponse;
import vn.cococord.service.IFileStorageService;
import vn.cococord.service.IMessageService;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class MessageActionController {

    private final IMessageService messageService;
    private final IFileStorageService fileStorageService;

    /**
     * Upload a file for message attachment
     */
    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        String username = authentication.getName();
        log.info("File upload requested by user: {}, filename: {}", username, file.getOriginalFilename());
        
        FileUploadResponse response = fileStorageService.uploadFile(file, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Add reaction to a message
     */
    @PostMapping("/messages/{messageId}/reactions")
    public ResponseEntity<MessageResponse> addReaction(
            @PathVariable String messageId,
            @Valid @RequestBody AddReactionRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        messageService.addReaction(messageId, request.getEmoji(), username);
        
        return ResponseEntity.ok(new MessageResponse("Reaction added successfully"));
    }

    /**
     * Remove reaction from a message
     */
    @DeleteMapping("/messages/{messageId}/reactions/{emoji}")
    public ResponseEntity<MessageResponse> removeReaction(
            @PathVariable String messageId,
            @PathVariable String emoji,
            Authentication authentication) {
        String username = authentication.getName();
        messageService.removeReaction(messageId, emoji, username);
        
        return ResponseEntity.ok(new MessageResponse("Reaction removed successfully"));
    }

    /**
     * Pin a message
     */
    @PostMapping("/messages/{messageId}/pin")
    public ResponseEntity<MessageResponse> pinMessage(
            @PathVariable String messageId,
            Authentication authentication) {
        String username = authentication.getName();
        messageService.pinMessage(messageId, username);
        
        return ResponseEntity.ok(new MessageResponse("Message pinned successfully"));
    }

    /**
     * Unpin a message
     */
    @DeleteMapping("/messages/{messageId}/pin")
    public ResponseEntity<MessageResponse> unpinMessage(
            @PathVariable String messageId,
            Authentication authentication) {
        String username = authentication.getName();
        messageService.unpinMessage(messageId, username);
        
        return ResponseEntity.ok(new MessageResponse("Message unpinned successfully"));
    }
}
