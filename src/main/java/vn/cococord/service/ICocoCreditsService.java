package vn.cococord.service;

import java.math.BigDecimal;
import java.util.List;

import vn.cococord.entity.mysql.CocoCreditTransaction;
import vn.cococord.entity.mysql.CocoCredits;
import vn.cococord.entity.mysql.User;

public interface ICocoCreditsService {
    
    /**
     * Get or create credits account for user
     */
    CocoCredits getOrCreateCredits(User user);
    
    /**
     * Get credits balance for user
     */
    BigDecimal getBalance(Long userId);
    
    /**
     * Add credits to user account
     */
    CocoCredits addCredits(Long userId, BigDecimal amount, String description, String referenceType, Long referenceId);
    
    /**
     * Spend credits from user account
     * @return true if successful, false if insufficient balance
     */
    boolean spendCredits(Long userId, BigDecimal amount, String description, String referenceType, Long referenceId);
    
    /**
     * Check if user can afford amount
     */
    boolean canAfford(Long userId, BigDecimal amount);
    
    /**
     * Get transaction history
     */
    List<CocoCreditTransaction> getTransactionHistory(Long userId, int page, int size);
    
    /**
     * Get recent transactions
     */
    List<CocoCreditTransaction> getRecentTransactions(Long userId);
    
    /**
     * Admin: Adjust credits (can be positive or negative)
     */
    CocoCredits adminAdjustCredits(Long userId, BigDecimal amount, String reason);
}
