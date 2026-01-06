package vn.cococord.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import vn.cococord.entity.mysql.ShopItem;

@Repository
public interface IShopItemRepository extends JpaRepository<ShopItem, Long> {
    
    List<ShopItem> findByIsActiveTrueOrderBySortOrderAsc();
    
    List<ShopItem> findByCategoryAndIsActiveTrueOrderBySortOrderAsc(ShopItem.ItemCategory category);
    
    @Query("SELECT i FROM ShopItem i WHERE i.isActive = true AND " +
           "(i.availableFrom IS NULL OR i.availableFrom <= CURRENT_TIMESTAMP) AND " +
           "(i.availableUntil IS NULL OR i.availableUntil >= CURRENT_TIMESTAMP) " +
           "ORDER BY i.sortOrder ASC")
    List<ShopItem> findAvailableItems();
    
    @Query("SELECT i FROM ShopItem i WHERE i.isActive = true AND i.category = :category AND " +
           "(i.availableFrom IS NULL OR i.availableFrom <= CURRENT_TIMESTAMP) AND " +
           "(i.availableUntil IS NULL OR i.availableUntil >= CURRENT_TIMESTAMP) " +
           "ORDER BY i.sortOrder ASC")
    List<ShopItem> findAvailableItemsByCategory(ShopItem.ItemCategory category);
    
    List<ShopItem> findByIsLimitedTrueAndIsActiveTrue();
}
