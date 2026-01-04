package vn.cococord.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.cococord.entity.mysql.Report;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IReportRepository extends JpaRepository<Report, Long> {

    Page<Report> findByStatus(Report.ReportStatus status, Pageable pageable);

    Page<Report> findByType(Report.ReportType type, Pageable pageable);

    Page<Report> findByStatusAndType(Report.ReportStatus status, Report.ReportType type, Pageable pageable);

    @Query("SELECT r FROM Report r WHERE r.reportedUser.id = :userId")
    List<Report> findByReportedUserId(@Param("userId") Long userId);

    @Query("SELECT r FROM Report r WHERE r.reportedServer.id = :serverId")
    List<Report> findByReportedServerId(@Param("serverId") Long serverId);

    long countByStatus(Report.ReportStatus status);

    long countByCreatedAtAfter(LocalDateTime date);

    @Query("SELECT r FROM Report r WHERE r.status = :status ORDER BY r.createdAt DESC")
    List<Report> findRecentByStatus(@Param("status") Report.ReportStatus status, Pageable pageable);

    @Query("SELECT COUNT(r) FROM Report r WHERE r.status = 'PENDING'")
    long countPending();
}
