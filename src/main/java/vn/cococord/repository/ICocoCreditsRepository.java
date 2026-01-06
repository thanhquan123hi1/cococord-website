package vn.cococord.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import vn.cococord.entity.mysql.CocoCredits;
import vn.cococord.entity.mysql.User;

@Repository
public interface ICocoCreditsRepository extends JpaRepository<CocoCredits, Long> {
    
    Optional<CocoCredits> findByUser(User user);
    
    Optional<CocoCredits> findByUserId(Long userId);
    
    boolean existsByUserId(Long userId);
}
