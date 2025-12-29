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
public class SetUserNoteRequest {

    @Size(max = 256, message = "Note cannot exceed 256 characters")
    private String note;
}
