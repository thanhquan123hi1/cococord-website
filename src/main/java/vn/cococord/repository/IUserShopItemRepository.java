package vn.cococord.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import vn.cococord.entity.mysql.ShopItem;
import vn.cococord.entity.mysql.UserShopItem;

@Repository
public interface IUserShopItemRepository extends JpaRepository<UserShopItem, Long> {
    
    List<UserShopItem> findByUserIdOrderByPurchasedAtDesc(Long userId);
    
    List<UserShopItem> findByUserIdAndItem_Category(Long userId, ShopItem.ItemCategory category);
    
    Optional<UserShopItem> findByUserIdAndItemId(Long userId, Long itemId);
    
    boolean existsByUserIdAndItemId(Long userId, Long itemId);
    
    @Query("SELECT ui FROM UserShopItem ui WHERE ui.user.id = :userId AND ui.isEquipped = true")
    List<UserShopItem> findEquippedItems(Long userId);
    
    @Query("SELECT ui FROM UserShopItem ui WHERE ui.user.id = :userId AND ui.item.category = :category AND ui.isEquipped = true")
    Optional<UserShopItem> findEquippedItemByCategory(Long userId, ShopItem.ItemCategory category);
}
