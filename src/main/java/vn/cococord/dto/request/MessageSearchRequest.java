package vn.cococord.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for message search
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageSearchRequest {
    
    @NotBlank(message = "Từ khóa tìm kiếm không được để trống")
    @Size(min = 2, max = 100, message = "Từ khóa tìm kiếm phải từ 2-100 ký tự")
    private String keyword;
    
    // Optional: search in specific channel
    private Long channelId;
    
    // Optional: search in all channels of a server
    private Long serverId;
    
    // Optional: filter by sender
    private Long userId;
    
    // Optional: filter by message type
    private String messageType;
    
    // Optional: include attachments only
    private Boolean hasAttachments;
    
    // Pagination
    @Builder.Default
    private Integer page = 0;
    
    @Builder.Default
    private Integer size = 20;
}
