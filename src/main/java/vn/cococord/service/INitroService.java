package vn.cococord.service;

import java.util.List;
import java.util.Optional;

import vn.cococord.entity.mysql.NitroTier;
import vn.cococord.entity.mysql.UserNitroSubscription;

public interface INitroService {
    
    /**
     * Get all available Nitro tiers
     */
    List<NitroTier> getAllTiers();
    
    /**
     * Get tier by code
     */
    Optional<NitroTier> getTierByCode(String code);
    
    /**
     * Get tier by ID
     */
    Optional<NitroTier> getTierById(Long tierId);
    
    /**
     * Subscribe user to Nitro tier
     */
    UserNitroSubscription subscribe(Long userId, String tierCode, UserNitroSubscription.SubscriptionType type);
    
    /**
     * Get user's active subscription
     */
    Optional<UserNitroSubscription> getActiveSubscription(Long userId);
    
    /**
     * Check if user has active Nitro
     */
    boolean hasActiveNitro(Long userId);
    
    /**
     * Get user's Nitro tier (if subscribed)
     */
    Optional<NitroTier> getUserNitroTier(Long userId);
    
    /**
     * Cancel subscription
     */
    void cancelSubscription(Long userId);
    
    /**
     * Get discount percent for user based on Nitro tier
     */
    int getDiscountPercent(Long userId);
    
    /**
     * Process expired subscriptions (scheduled task)
     */
    void processExpiredSubscriptions();
}
