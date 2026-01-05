package vn.cococord.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.cococord.entity.mysql.AdminAuditLog;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IAdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {

        Page<AdminAuditLog> findByActionType(AdminAuditLog.AdminActionType actionType, Pageable pageable);

        @Query("SELECT a FROM AdminAuditLog a WHERE a.actor.id = :actorId ORDER BY a.createdAt DESC")
        Page<AdminAuditLog> findByActorId(@Param("actorId") Long actorId, Pageable pageable);

        @Query("SELECT a FROM AdminAuditLog a WHERE a.targetType = :targetType AND a.targetId = :targetId ORDER BY a.createdAt DESC")
        List<AdminAuditLog> findByTarget(@Param("targetType") String targetType, @Param("targetId") Long targetId);

        @Query("SELECT a FROM AdminAuditLog a WHERE a.targetType = :targetType AND a.targetId = :targetId ORDER BY a.createdAt DESC")
        Page<AdminAuditLog> findByTargetTypeAndTargetId(@Param("targetType") String targetType,
                        @Param("targetId") Long targetId, Pageable pageable);

        @Query("SELECT a FROM AdminAuditLog a WHERE a.createdAt BETWEEN :start AND :end ORDER BY a.createdAt DESC")
        Page<AdminAuditLog> findByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end,
                        Pageable pageable);

        @Query("SELECT a FROM AdminAuditLog a WHERE " +
                        "(:actionType IS NULL OR a.actionType = :actionType) AND " +
                        "(:actorId IS NULL OR a.actor.id = :actorId) AND " +
                        "(:targetType IS NULL OR a.targetType = :targetType) " +
                        "ORDER BY a.createdAt DESC")
        Page<AdminAuditLog> findWithFilters(
                        @Param("actionType") AdminAuditLog.AdminActionType actionType,
                        @Param("actorId") Long actorId,
                        @Param("targetType") String targetType,
                        Pageable pageable);
}
