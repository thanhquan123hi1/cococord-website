package vn.cococord.controller.api;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import vn.cococord.dto.response.CocoCreditsResponse;
import vn.cococord.dto.response.CreditTransactionResponse;
import vn.cococord.entity.mysql.CocoCreditTransaction;
import vn.cococord.entity.mysql.CocoCredits;
import vn.cococord.entity.mysql.User;
import vn.cococord.security.CurrentUser;
import vn.cococord.service.ICocoCreditsService;

@RestController
@RequestMapping("/api/credits")
@RequiredArgsConstructor
public class CocoCreditsController {

    private final ICocoCreditsService cocoCreditsService;

    @GetMapping
    public ResponseEntity<CocoCreditsResponse> getBalance(@CurrentUser User user) {
        CocoCredits credits = cocoCreditsService.getOrCreateCredits(user);
        return ResponseEntity.ok(mapToResponse(credits));
    }

    @GetMapping("/transactions")
    public ResponseEntity<Map<String, Object>> getTransactions(
            @CurrentUser User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        List<CocoCreditTransaction> transactions = cocoCreditsService.getTransactionHistory(
                user.getId(), page, size
        );

        List<CreditTransactionResponse> content = transactions.stream()
                .map(this::mapToTransactionResponse)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("transactions", content);
        response.put("page", page);
        response.put("size", size);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/transactions/recent")
    public ResponseEntity<List<CreditTransactionResponse>> getRecentTransactions(
            @CurrentUser User user) {
        
        List<CocoCreditTransaction> transactions = cocoCreditsService.getRecentTransactions(user.getId());
        
        List<CreditTransactionResponse> response = transactions.stream()
                .map(this::mapToTransactionResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    private CocoCreditsResponse mapToResponse(CocoCredits credits) {
        return CocoCreditsResponse.builder()
                .userId(credits.getUser().getId())
                .balance(credits.getBalance())
                .totalEarned(credits.getTotalEarned())
                .totalSpent(credits.getTotalSpent())
                .updatedAt(credits.getUpdatedAt())
                .build();
    }

    private CreditTransactionResponse mapToTransactionResponse(CocoCreditTransaction transaction) {
        return CreditTransactionResponse.builder()
                .id(transaction.getId())
                .type(transaction.getType())
                .amount(transaction.getAmount())
                .balanceAfter(transaction.getBalanceAfter())
                .description(transaction.getDescription())
                .referenceType(transaction.getReferenceType())
                .referenceId(transaction.getReferenceId())
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}
