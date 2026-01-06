package vn.cococord.service.impl;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.entity.mysql.CocoCreditTransaction;
import vn.cococord.entity.mysql.CocoCredits;
import vn.cococord.entity.mysql.User;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.repository.ICocoCreditTransactionRepository;
import vn.cococord.repository.ICocoCreditsRepository;
import vn.cococord.repository.IUserRepository;
import vn.cococord.service.ICocoCreditsService;

@Service
@RequiredArgsConstructor
@Slf4j
public class CocoCreditsServiceImpl implements ICocoCreditsService {

    private final ICocoCreditsRepository creditsRepository;
    private final ICocoCreditTransactionRepository transactionRepository;
    private final IUserRepository userRepository;

    @Override
    @Transactional
    public CocoCredits getOrCreateCredits(User user) {
        return creditsRepository.findByUser(user)
                .orElseGet(() -> {
                    CocoCredits credits = CocoCredits.builder()
                            .user(user)
                            .balance(BigDecimal.ZERO)
                            .totalEarned(BigDecimal.ZERO)
                            .totalSpent(BigDecimal.ZERO)
                            .build();
                    return creditsRepository.save(credits);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getBalance(Long userId) {
        return creditsRepository.findByUserId(userId)
                .map(CocoCredits::getBalance)
                .orElse(BigDecimal.ZERO);
    }

    @Override
    @Transactional
    public CocoCredits addCredits(Long userId, BigDecimal amount, String description, String referenceType, Long referenceId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        CocoCredits credits = getOrCreateCredits(user);
        credits.addCredits(amount);
        credits = creditsRepository.save(credits);
        
        // Log transaction
        CocoCreditTransaction transaction = CocoCreditTransaction.builder()
                .user(user)
                .type(CocoCreditTransaction.TransactionType.EARN)
                .amount(amount)
                .balanceAfter(credits.getBalance())
                .description(description)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .build();
        transactionRepository.save(transaction);
        
        log.info("Added {} credits to user {} - {}", amount, userId, description);
        return credits;
    }

    @Override
    @Transactional
    public boolean spendCredits(Long userId, BigDecimal amount, String description, String referenceType, Long referenceId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        CocoCredits credits = getOrCreateCredits(user);
        
        if (!credits.spendCredits(amount)) {
            log.warn("User {} has insufficient credits: {} < {}", userId, credits.getBalance(), amount);
            return false;
        }
        
        credits = creditsRepository.save(credits);
        
        // Log transaction
        CocoCreditTransaction transaction = CocoCreditTransaction.builder()
                .user(user)
                .type(CocoCreditTransaction.TransactionType.SPEND)
                .amount(amount.negate())
                .balanceAfter(credits.getBalance())
                .description(description)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .build();
        transactionRepository.save(transaction);
        
        log.info("User {} spent {} credits - {}", userId, amount, description);
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canAfford(Long userId, BigDecimal amount) {
        return getBalance(userId).compareTo(amount) >= 0;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CocoCreditTransaction> getTransactionHistory(Long userId, int page, int size) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size)).getContent();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CocoCreditTransaction> getRecentTransactions(Long userId) {
        return transactionRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    @Transactional
    public CocoCredits adminAdjustCredits(Long userId, BigDecimal amount, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        CocoCredits credits = getOrCreateCredits(user);
        
        if (amount.compareTo(BigDecimal.ZERO) >= 0) {
            credits.addCredits(amount);
        } else {
            credits.spendCredits(amount.abs());
        }
        
        credits = creditsRepository.save(credits);
        
        // Log transaction
        CocoCreditTransaction transaction = CocoCreditTransaction.builder()
                .user(user)
                .type(CocoCreditTransaction.TransactionType.ADMIN)
                .amount(amount)
                .balanceAfter(credits.getBalance())
                .description("Admin adjustment: " + reason)
                .referenceType("ADMIN")
                .build();
        transactionRepository.save(transaction);
        
        log.info("Admin adjusted {} credits for user {} - {}", amount, userId, reason);
        return credits;
    }
}
