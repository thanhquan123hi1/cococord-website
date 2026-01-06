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
import vn.cococord.entity.mysql.User;
import vn.cococord.entity.mysql.UserNitroSubscription;
import vn.cococord.exception.BadRequestException;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.repository.INitroTierRepository;
import vn.cococord.repository.IUserNitroSubscriptionRepository;
import vn.cococord.repository.IUserRepository;
import vn.cococord.service.ICocoCreditsService;
import vn.cococord.service.INitroService;

@Service
@RequiredArgsConstructor
@Slf4j
public class NitroServiceImpl implements INitroService {

    private final INitroTierRepository tierRepository;
    private final IUserNitroSubscriptionRepository subscriptionRepository;
    private final IUserRepository userRepository;
    private final ICocoCreditsService creditsService;

    @Override
    @Transactional(readOnly = true)
    public List<NitroTier> getAllTiers() {
        return tierRepository.findByIsActiveTrueOrderBySortOrderAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<NitroTier> getTierByCode(String code) {
        return tierRepository.findByCode(code);
    }

    @Override
    @Transactional
    public UserNitroSubscription subscribe(Long userId, String tierCode, UserNitroSubscription.SubscriptionType type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        NitroTier tier = tierRepository.findByCode(tierCode)
                .orElseThrow(() -> new ResourceNotFoundException("Nitro tier not found: " + tierCode));
        
        // Check if user already has active subscription
        Optional<UserNitroSubscription> existing = subscriptionRepository.findActiveSubscription(userId);
        if (existing.isPresent()) {
            throw new BadRequestException("User already has an active Nitro subscription");
        }
        
        // Calculate price
        BigDecimal price = type == UserNitroSubscription.SubscriptionType.YEARLY 
                ? tier.getYearlyPrice() 
                : tier.getMonthlyPrice();
        
        // Check and deduct credits
        if (!creditsService.spendCredits(userId, price, 
                "Nitro " + tier.getName() + " subscription (" + type + ")", 
                "NITRO", tier.getId())) {
            throw new BadRequestException("Insufficient CoCo Credits");
        }
        
        // Create subscription
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endDate = type == UserNitroSubscription.SubscriptionType.YEARLY 
                ? now.plusYears(1) 
                : now.plusMonths(1);
        
        UserNitroSubscription subscription = UserNitroSubscription.builder()
                .user(user)
                .tier(tier)
                .subscriptionType(type)
                .startDate(now)
                .endDate(endDate)
                .isActive(true)
                .autoRenew(false)
                .build();
        
        subscription = subscriptionRepository.save(subscription);
        log.info("User {} subscribed to Nitro {} ({})", userId, tierCode, type);
        
        return subscription;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserNitroSubscription> getActiveSubscription(Long userId) {
        return subscriptionRepository.findActiveSubscription(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasActiveNitro(Long userId) {
        return subscriptionRepository.findActiveSubscription(userId).isPresent();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<NitroTier> getUserNitroTier(Long userId) {
        return subscriptionRepository.findActiveSubscription(userId)
                .map(UserNitroSubscription::getTier);
    }

    @Override
    @Transactional
    public void cancelSubscription(Long userId) {
        UserNitroSubscription subscription = subscriptionRepository.findActiveSubscription(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No active subscription found"));
        
        subscription.setAutoRenew(false);
        subscription.setCancelledAt(LocalDateTime.now());
        subscriptionRepository.save(subscription);
        
        log.info("User {} cancelled Nitro subscription", userId);
    }

    @Override
    @Transactional
    public void processExpiredSubscriptions() {
        List<UserNitroSubscription> expired = subscriptionRepository.findExpiredSubscriptions();
        for (UserNitroSubscription sub : expired) {
            sub.setIsActive(false);
            subscriptionRepository.save(sub);
            log.info("Deactivated expired Nitro subscription for user {}", sub.getUser().getId());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<NitroTier> getTierById(Long tierId) {
        return tierRepository.findById(tierId);
    }

    @Override
    @Transactional(readOnly = true)
    public int getDiscountPercent(Long userId) {
        return getActiveSubscription(userId)
                .map(sub -> sub.getTier().getDiscountPercent())
                .orElse(0);
    }
}
