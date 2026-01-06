package vn.cococord.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import vn.cococord.entity.mysql.CocoCreditTransaction;

@Repository
public interface ICocoCreditTransactionRepository extends JpaRepository<CocoCreditTransaction, Long> {
    
    Page<CocoCreditTransaction> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    List<CocoCreditTransaction> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<CocoCreditTransaction> findByUserIdAndReferenceTypeOrderByCreatedAtDesc(Long userId, String referenceType);
}
