package vn.cococord.controller.api;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
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
import vn.cococord.dto.request.SubscribeNitroRequest;
import vn.cococord.dto.response.NitroTierResponse;
import vn.cococord.dto.response.UserNitroResponse;
import vn.cococord.entity.mysql.NitroTier;
import vn.cococord.entity.mysql.User;
import vn.cococord.entity.mysql.UserNitroSubscription;
import vn.cococord.security.CurrentUser;
import vn.cococord.service.INitroService;

@RestController
@RequestMapping("/api/nitro")
@RequiredArgsConstructor
public class NitroController {

    private final INitroService nitroService;

    @GetMapping("/tiers")
    public ResponseEntity<List<NitroTierResponse>> getAllTiers() {
        List<NitroTier> tiers = nitroService.getAllTiers();
        List<NitroTierResponse> response = tiers.stream()
                .map(this::mapToTierResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tiers/{code}")
    public ResponseEntity<NitroTierResponse> getTierByCode(@PathVariable String code) {
        Optional<NitroTier> tier = nitroService.getTierByCode(code);
        return tier.map(t -> ResponseEntity.ok(mapToTierResponse(t)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/subscription")
    public ResponseEntity<UserNitroResponse> getCurrentSubscription(@CurrentUser User user) {
        Optional<UserNitroSubscription> subscription = nitroService.getActiveSubscription(user.getId());
        return subscription.map(s -> ResponseEntity.ok(mapToSubscriptionResponse(s)))
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/subscribe")
    public ResponseEntity<UserNitroResponse> subscribe(
            @CurrentUser User user,
            @Valid @RequestBody SubscribeNitroRequest request) {
        
        UserNitroSubscription subscription = nitroService.subscribe(
                user.getId(),
                request.getTierCode(),
                request.getSubscriptionType()
        );
        
        return ResponseEntity.ok(mapToSubscriptionResponse(subscription));
    }

    @PostMapping("/subscription/cancel")
    public ResponseEntity<Void> cancelSubscription(@CurrentUser User user) {
        nitroService.cancelSubscription(user.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/discount")
    public ResponseEntity<Integer> getDiscount(@CurrentUser User user) {
        int discount = nitroService.getDiscountPercent(user.getId());
        return ResponseEntity.ok(discount);
    }

    private NitroTierResponse mapToTierResponse(NitroTier tier) {
        List<String> features = tier.getFeatures() != null 
                ? Arrays.asList(tier.getFeatures().replace("[", "").replace("]", "").replace("\"", "").split(","))
                : List.of();
        
        return NitroTierResponse.builder()
                .id(tier.getId())
                .code(tier.getCode())
                .name(tier.getName())
                .description(tier.getDescription())
                .badgeUrl(tier.getBadgeUrl())
                .bannerUrl(tier.getBannerUrl())
                .monthlyPrice(tier.getMonthlyPrice())
                .yearlyPrice(tier.getYearlyPrice())
                .features(features)
                .maxFileUploadMb(tier.getMaxFileUploadMB())
                .customEmoji(tier.getCustomEmoji())
                .animatedAvatar(tier.getAnimatedAvatar())
                .customBanner(tier.getCustomBanner())
                .hdVideoStreaming(tier.getHdVideoStreaming())
                .serverBoosts(tier.getServerBoosts())
                .boostCount(tier.getBoostCount())
                .profileThemes(tier.getProfileThemes())
                .exclusiveStickers(tier.getExclusiveStickers())
                .discountPercent(tier.getDiscountPercent())
                .build();
    }

    private UserNitroResponse mapToSubscriptionResponse(UserNitroSubscription subscription) {
        long daysRemaining = 0;
        if (subscription.getEndDate() != null && subscription.getEndDate().isAfter(LocalDateTime.now())) {
            daysRemaining = Duration.between(LocalDateTime.now(), subscription.getEndDate()).toDays();
        }
        
        return UserNitroResponse.builder()
                .id(subscription.getId())
                .userId(subscription.getUser().getId())
                .tier(mapToTierResponse(subscription.getTier()))
                .subscriptionType(subscription.getSubscriptionType())
                .startDate(subscription.getStartDate())
                .endDate(subscription.getEndDate())
                .isActive(subscription.getIsActive())
                .autoRenew(subscription.getAutoRenew())
                .isExpired(subscription.isExpired())
                .daysRemaining(daysRemaining)
                .build();
    }
}
