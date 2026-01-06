package vn.cococord.service;

import java.util.List;
import java.util.Optional;

import vn.cococord.entity.mysql.ShopItem;
import vn.cococord.entity.mysql.UserShopItem;

public interface IShopService {
    
    /**
     * Get all available shop items
     */
    List<ShopItem> getAvailableItems();
    
    /**
     * Get items by category
     */
    List<ShopItem> getItemsByCategory(ShopItem.ItemCategory category);
    
    /**
     * Get item by ID
     */
    Optional<ShopItem> getItemById(Long itemId);
    
    /**
     * Purchase an item
     */
    UserShopItem purchaseItem(Long userId, Long itemId);
    
    /**
     * Get user's purchased items
     */
    List<UserShopItem> getUserItems(Long userId);
    
    /**
     * Get user's items by category
     */
    List<UserShopItem> getUserItemsByCategory(Long userId, ShopItem.ItemCategory category);
    
    /**
     * Equip an item
     */
    UserShopItem equipItem(Long userId, Long itemId);
    
    /**
     * Unequip an item
     */
    UserShopItem unequipItem(Long userId, Long itemId);
    
    /**
     * Get user's equipped items
     */
    List<UserShopItem> getEquippedItems(Long userId);
    
    /**
     * Check if user owns an item
     */
    boolean userOwnsItem(Long userId, Long itemId);
    
    /**
     * Check if user has item equipped
     */
    boolean isEquipped(Long userId, Long itemId);
}
