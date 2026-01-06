package vn.cococord.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import vn.cococord.entity.mysql.NitroTier;

@Repository
public interface INitroTierRepository extends JpaRepository<NitroTier, Long> {
    
    Optional<NitroTier> findByCode(String code);
    
    List<NitroTier> findByIsActiveTrueOrderBySortOrderAsc();
    
    boolean existsByCode(String code);
}
