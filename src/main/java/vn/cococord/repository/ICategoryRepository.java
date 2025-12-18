package vn.cococord.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.cococord.entity.mysql.Category;

@Repository
public interface ICategoryRepository extends JpaRepository<Category, Long> {

    @Query("SELECT c FROM Category c WHERE c.server.id = :serverId ORDER BY c.position ASC")
    List<Category> findByServerIdOrderByPosition(@Param("serverId") Long serverId);

    @Query("SELECT COALESCE(MAX(c.position), -1) FROM Category c WHERE c.server.id = :serverId")
    Integer findMaxPositionByServerId(@Param("serverId") Long serverId);

    @Query("SELECT COUNT(c) FROM Channel c WHERE c.category.id = :categoryId")
    Long countChannelsByCategoryId(@Param("categoryId") Long categoryId);

    boolean existsByServerIdAndName(Long serverId, String name);
}
