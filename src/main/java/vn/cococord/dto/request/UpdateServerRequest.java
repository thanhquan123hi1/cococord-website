package vn.cococord.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateServerRequest {

    @Size(min = 2, max = 100, message = "Server name must be between 2 and 100 characters")
    private String name;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    @Size(max = 500, message = "Icon URL cannot exceed 500 characters")
    private String iconUrl;

    @Size(max = 500, message = "Banner URL cannot exceed 500 characters")
    private String bannerUrl;

    private Boolean isPublic;

    private Integer maxMembers;
}
