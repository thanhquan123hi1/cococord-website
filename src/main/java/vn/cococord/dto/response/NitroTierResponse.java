package vn.cococord.dto.response;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NitroTierResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String badgeUrl;
    private String bannerUrl;
    private BigDecimal monthlyPrice;
    private BigDecimal yearlyPrice;
    private List<String> features;
    private Integer maxFileUploadMb;
    private Boolean customEmoji;
    private Boolean animatedAvatar;
    private Boolean customBanner;
    private Boolean hdVideoStreaming;
    private Boolean serverBoosts;
    private Integer boostCount;
    private Integer profileThemes;
    private Boolean exclusiveStickers;
    private Integer discountPercent;
}
