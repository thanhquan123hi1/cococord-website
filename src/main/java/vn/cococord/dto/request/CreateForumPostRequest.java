package vn.cococord.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateForumPostRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 25, message = "Title must be between 1 and 25 characters")
    private String title;

    @NotBlank(message = "Image URL is required")
    private String imageUrl;

    private String content;
}
