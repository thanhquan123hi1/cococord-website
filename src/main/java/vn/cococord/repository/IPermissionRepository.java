package vn.cococord.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import vn.cococord.entity.mysql.Permission;

@Repository
public interface IPermissionRepository extends JpaRepository<Permission, Long> {
    
    Optional<Permission> findByName(String name);
    
    List<Permission> findByCategory(Permission.PermissionCategory category);
    
    @Query("SELECT p FROM Permission p ORDER BY p.category, p.name")
    List<Permission> findAllOrderedByCategory();
    
    boolean existsByName(String name);
}
