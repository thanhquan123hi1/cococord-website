package vn.cococord.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddReactionRequest {

    @NotBlank(message = "Emoji cannot be empty")
    @Pattern(regexp = "^[\\p{So}\\p{Sk}\\p{Sm}\\p{Sc}\\p{Nl}\\p{No}\\p{Cf}\\u200D\\uFE0F]+$|^:[a-zA-Z0-9_]+:$", 
             message = "Invalid emoji format")
    private String emoji;
}
