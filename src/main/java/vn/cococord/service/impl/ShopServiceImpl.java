package vn.cococord.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.entity.mysql.NitroTier;
import vn.cococord.entity.mysql.ShopItem;
import vn.cococord.entity.mysql.User;
import vn.cococord.entity.mysql.UserShopItem;
import vn.cococord.exception.BadRequestException;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.repository.IShopItemRepository;
import vn.cococord.repository.IUserRepository;
import vn.cococord.repository.IUserShopItemRepository;
import vn.cococord.service.ICocoCreditsService;
import vn.cococord.service.INitroService;
import vn.cococord.service.IShopService;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShopServiceImpl implements IShopService {

    private final IShopItemRepository itemRepository;
    private final IUserShopItemRepository userItemRepository;
    private final IUserRepository userRepository;
    private final ICocoCreditsService creditsService;
    private final INitroService nitroService;

    @Override
    @Transactional(readOnly = true)
    public List<ShopItem> getAvailableItems() {
        return itemRepository.findAvailableItems();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShopItem> getItemsByCategory(ShopItem.ItemCategory category) {
        return itemRepository.findAvailableItemsByCategory(category);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ShopItem> getItemById(Long itemId) {
        return itemRepository.findById(itemId);
    }

    @Override
    @Transactional
    public UserShopItem purchaseItem(Long userId, Long itemId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        ShopItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));
        
        // Check if already owned
        if (userItemRepository.existsByUserIdAndItemId(userId, itemId)) {
            throw new BadRequestException("You already own this item");
        }
        
        // Check availability
        if (!item.isAvailable()) {
            throw new BadRequestException("This item is not available");
        }
        
        // Check Nitro requirement
        if (item.getRequiredNitroTier() != null) {
            Optional<NitroTier> userTier = nitroService.getUserNitroTier(userId);
            if (userTier.isEmpty() || userTier.get().getSortOrder() < item.getRequiredNitroTier().getSortOrder()) {
                throw new BadRequestException("This item requires " + item.getRequiredNitroTier().getName());
            }
        }
        
        // Calculate price with Nitro discount
        BigDecimal finalPrice = item.getPrice();
        Optional<NitroTier> userTier = nitroService.getUserNitroTier(userId);
        if (userTier.isPresent() && userTier.get().getDiscountPercent() > 0) {
            BigDecimal discount = finalPrice.multiply(BigDecimal.valueOf(userTier.get().getDiscountPercent()))
                    .divide(BigDecimal.valueOf(100));
            finalPrice = finalPrice.subtract(discount);
        }
        
        // Deduct credits
        if (!creditsService.spendCredits(userId, finalPrice, 
                "Purchase: " + item.getName(), "SHOP_PURCHASE", itemId)) {
            throw new BadRequestException("Insufficient CoCo Credits");
        }
        
        // Update stock if limited
        if (item.getIsLimited() && item.getStockLimit() != null) {
            item.setSoldCount((item.getSoldCount() == null ? 0 : item.getSoldCount()) + 1);
            itemRepository.save(item);
        }
        
        // Create purchase record
        UserShopItem userItem = UserShopItem.builder()
                .user(user)
                .item(item)
                .purchasePrice(finalPrice)
                .isEquipped(false)
                .build();
        
        userItem = userItemRepository.save(userItem);
        log.info("User {} purchased item {} for {} credits", userId, item.getName(), finalPrice);
        
        return userItem;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserShopItem> getUserItems(Long userId) {
        return userItemRepository.findByUserIdOrderByPurchasedAtDesc(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserShopItem> getUserItemsByCategory(Long userId, ShopItem.ItemCategory category) {
        return userItemRepository.findByUserIdAndItem_Category(userId, category);
    }

    @Override
    @Transactional
    public UserShopItem equipItem(Long userId, Long itemId) {
        UserShopItem userItem = userItemRepository.findByUserIdAndItemId(userId, itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found in inventory"));
        
        // Unequip any currently equipped item of same category
        ShopItem.ItemCategory category = userItem.getItem().getCategory();
        userItemRepository.findEquippedItemByCategory(userId, category)
                .ifPresent(equipped -> {
                    equipped.setIsEquipped(false);
                    userItemRepository.save(equipped);
                });
        
        // Equip new item
        userItem.setIsEquipped(true);
        userItem.setEquippedAt(LocalDateTime.now());
        userItem = userItemRepository.save(userItem);
        
        log.info("User {} equipped item {}", userId, userItem.getItem().getName());
        return userItem;
    }

    @Override
    @Transactional
    public UserShopItem unequipItem(Long userId, Long itemId) {
        UserShopItem userItem = userItemRepository.findByUserIdAndItemId(userId, itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found in inventory"));
        
        userItem.setIsEquipped(false);
        userItem = userItemRepository.save(userItem);
        log.info("User {} unequipped item {}", userId, userItem.getItem().getName());
        return userItem;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserShopItem> getEquippedItems(Long userId) {
        return userItemRepository.findEquippedItems(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean userOwnsItem(Long userId, Long itemId) {
        return userItemRepository.existsByUserIdAndItemId(userId, itemId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isEquipped(Long userId, Long itemId) {
        return userItemRepository.findByUserIdAndItemId(userId, itemId)
                .map(UserShopItem::getIsEquipped)
                .orElse(false);
    }
}
