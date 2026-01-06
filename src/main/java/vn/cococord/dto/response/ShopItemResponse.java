package vn.cococord.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.cococord.entity.mysql.ShopItem;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopItemResponse {
    private Long id;
    private String name;
    private String description;
    private ShopItem.ItemCategory category;
    private ShopItem.ItemRarity rarity;
    private BigDecimal price;
    private BigDecimal discountedPrice;
    private String previewUrl;
    private String assetUrl;
    private String cssStyles;
    private String animationClass;
    private Boolean isLimited;
    private Integer stockLimit;
    private Integer soldCount;
    private Integer stockRemaining;
    private LocalDateTime availableFrom;
    private LocalDateTime availableUntil;
    private Long requiredNitroTierId;
    private Boolean owned;
    private Boolean equipped;
}
