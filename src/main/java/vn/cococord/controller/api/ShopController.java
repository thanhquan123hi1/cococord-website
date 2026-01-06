package vn.cococord.controller.api;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import vn.cococord.dto.request.PurchaseItemRequest;
import vn.cococord.dto.response.ShopItemResponse;
import vn.cococord.entity.mysql.ShopItem;
import vn.cococord.entity.mysql.User;
import vn.cococord.entity.mysql.UserShopItem;
import vn.cococord.security.CurrentUser;
import vn.cococord.service.INitroService;
import vn.cococord.service.IShopService;

@RestController
@RequestMapping("/api/shop")
@RequiredArgsConstructor
public class ShopController {

    private final IShopService shopService;
    private final INitroService nitroService;

    @GetMapping("/items")
    public ResponseEntity<List<ShopItemResponse>> getAllItems(@CurrentUser User user) {
        List<ShopItem> items = shopService.getAvailableItems();
        List<UserShopItem> userItems = shopService.getUserItems(user.getId());
        
        Set<Long> ownedIds = userItems.stream()
                .map(ui -> ui.getItem().getId())
                .collect(Collectors.toSet());
        
        Map<Long, Boolean> equippedMap = userItems.stream()
                .collect(Collectors.toMap(
                        ui -> ui.getItem().getId(),
                        UserShopItem::getIsEquipped
                ));
        
        int discount = nitroService.getDiscountPercent(user.getId());
        
        List<ShopItemResponse> response = items.stream()
                .map(item -> mapToItemResponse(item, ownedIds.contains(item.getId()), 
                        equippedMap.getOrDefault(item.getId(), false), discount))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/items/category/{category}")
    public ResponseEntity<List<ShopItemResponse>> getItemsByCategory(
            @CurrentUser User user,
            @PathVariable ShopItem.ItemCategory category) {
        
        List<ShopItem> items = shopService.getItemsByCategory(category);
        List<UserShopItem> userItems = shopService.getUserItems(user.getId());
        
        Set<Long> ownedIds = userItems.stream()
                .map(ui -> ui.getItem().getId())
                .collect(Collectors.toSet());
        
        Map<Long, Boolean> equippedMap = userItems.stream()
                .collect(Collectors.toMap(
                        ui -> ui.getItem().getId(),
                        UserShopItem::getIsEquipped
                ));
        
        int discount = nitroService.getDiscountPercent(user.getId());
        
        List<ShopItemResponse> response = items.stream()
                .map(item -> mapToItemResponse(item, ownedIds.contains(item.getId()), 
                        equippedMap.getOrDefault(item.getId(), false), discount))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<ShopItemResponse> getItem(
            @CurrentUser User user,
            @PathVariable Long id) {
        
        return shopService.getItemById(id)
                .map(item -> {
                    boolean owned = shopService.userOwnsItem(user.getId(), id);
                    boolean equipped = shopService.isEquipped(user.getId(), id);
                    int discount = nitroService.getDiscountPercent(user.getId());
                    return ResponseEntity.ok(mapToItemResponse(item, owned, equipped, discount));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/inventory")
    public ResponseEntity<List<ShopItemResponse>> getInventory(@CurrentUser User user) {
        List<UserShopItem> userItems = shopService.getUserItems(user.getId());
        
        List<ShopItemResponse> response = userItems.stream()
                .map(ui -> mapToItemResponse(ui.getItem(), true, ui.getIsEquipped(), 0))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/inventory/category/{category}")
    public ResponseEntity<List<ShopItemResponse>> getInventoryByCategory(
            @CurrentUser User user,
            @PathVariable ShopItem.ItemCategory category) {
        
        List<UserShopItem> userItems = shopService.getUserItemsByCategory(user.getId(), category);
        
        List<ShopItemResponse> response = userItems.stream()
                .map(ui -> mapToItemResponse(ui.getItem(), true, ui.getIsEquipped(), 0))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/equipped")
    public ResponseEntity<List<ShopItemResponse>> getEquippedItems(@CurrentUser User user) {
        List<UserShopItem> equippedItems = shopService.getEquippedItems(user.getId());
        
        List<ShopItemResponse> response = equippedItems.stream()
                .map(ui -> mapToItemResponse(ui.getItem(), true, true, 0))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/purchase")
    public ResponseEntity<ShopItemResponse> purchaseItem(
            @CurrentUser User user,
            @Valid @RequestBody PurchaseItemRequest request) {
        
        UserShopItem purchase = shopService.purchaseItem(user.getId(), request.getItemId());
        return ResponseEntity.ok(mapToItemResponse(purchase.getItem(), true, false, 0));
    }

    @PostMapping("/items/{id}/equip")
    public ResponseEntity<ShopItemResponse> equipItem(
            @CurrentUser User user,
            @PathVariable Long id) {
        
        UserShopItem equipped = shopService.equipItem(user.getId(), id);
        return ResponseEntity.ok(mapToItemResponse(equipped.getItem(), true, true, 0));
    }

    @PostMapping("/items/{id}/unequip")
    public ResponseEntity<ShopItemResponse> unequipItem(
            @CurrentUser User user,
            @PathVariable Long id) {
        
        UserShopItem unequipped = shopService.unequipItem(user.getId(), id);
        return ResponseEntity.ok(mapToItemResponse(unequipped.getItem(), true, false, 0));
    }

    private ShopItemResponse mapToItemResponse(ShopItem item, boolean owned, boolean equipped, int discount) {
        BigDecimal discountedPrice = item.getPrice();
        if (discount > 0) {
            discountedPrice = item.getPrice().multiply(BigDecimal.valueOf(100 - discount))
                    .divide(BigDecimal.valueOf(100));
        }
        
        Integer stockRemaining = null;
        if (item.getIsLimited() && item.getStockLimit() != null) {
            stockRemaining = item.getStockLimit() - (item.getSoldCount() != null ? item.getSoldCount() : 0);
        }
        
        return ShopItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .category(item.getCategory())
                .rarity(item.getRarity())
                .price(item.getPrice())
                .discountedPrice(discount > 0 ? discountedPrice : null)
                .previewUrl(item.getPreviewUrl())
                .assetUrl(item.getAssetUrl())
                .cssStyles(item.getCssStyles())
                .animationClass(item.getAnimationClass())
                .isLimited(item.getIsLimited())
                .stockLimit(item.getStockLimit())
                .soldCount(item.getSoldCount())
                .stockRemaining(stockRemaining)
                .availableFrom(item.getAvailableFrom())
                .availableUntil(item.getAvailableUntil())
                .requiredNitroTierId(item.getRequiredNitroTier() != null ? item.getRequiredNitroTier().getId() : null)
                .owned(owned)
                .equipped(equipped)
                .build();
    }
}
