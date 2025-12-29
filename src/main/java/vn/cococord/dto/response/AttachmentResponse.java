package vn.cococord.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttachmentResponse {

    private String id;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Long fileSize;
    private String thumbnailUrl;
    private Integer width;
    private Integer height;
}
