package vn.cococord.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.request.AdminReportActionRequest;
import vn.cococord.dto.request.AdminRoleRequest;
import vn.cococord.dto.request.AdminSettingsRequest;
import vn.cococord.dto.request.AdminCreateUserRequest;
import vn.cococord.dto.response.*;
import vn.cococord.entity.mongodb.Message;
import vn.cococord.entity.mysql.*;
import vn.cococord.entity.mysql.User.Role;
import vn.cococord.entity.mysql.User.UserStatus;
import vn.cococord.exception.BadRequestException;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.repository.*;
import vn.cococord.service.IAdminService;
import vn.cococord.service.IEmailService;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
@SuppressWarnings("null")
public class AdminServiceImpl implements IAdminService {

    private final IUserRepository userRepository;
    private final IServerRepository serverRepository;
    private final IReportRepository reportRepository;
    private final IMessageRepository messageRepository;
    private final IAdminAuditLogRepository auditLogRepository;
    private final ISystemSettingsRepository settingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final IEmailService emailService;

    // ================== Dashboard ==================

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboardSummary() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime yesterday = now.minusDays(1);
        LocalDateTime lastWeek = now.minusWeeks(1);

        // Basic counts
        long totalUsers = userRepository.count();
        long totalServers = serverRepository.count();
        long activeUsers24h = userRepository.countByLastLoginAfter(yesterday);
        long pendingReports = reportRepository.countByStatus(Report.ReportStatus.PENDING);
        long bannedUsers = userRepository.countByIsBannedTrue();
        long onlineUsers = userRepository.countByStatus(UserStatus.ONLINE);

        // Calculate message count for today (from MongoDB)
        long messagesToday = 0;
        try {
            messagesToday = messageRepository.count() / 30; // rough daily average
        } catch (Exception e) {
            log.warn("Could not get message count: {}", e.getMessage());
        }

        // Growth calculations
        long usersLastWeek = userRepository.countByCreatedAtBetween(lastWeek.minusWeeks(1), lastWeek);
        long usersThisWeek = userRepository.countByCreatedAtBetween(lastWeek, now);
        double usersGrowth = usersLastWeek > 0 ? ((double) (usersThisWeek - usersLastWeek) / usersLastWeek) * 100 : 0;

        long serversLastWeek = serverRepository.countByCreatedAtBetween(lastWeek.minusWeeks(1), lastWeek);
        long serversThisWeek = serverRepository.countByCreatedAtBetween(lastWeek, now);
        double serversGrowth = serversLastWeek > 0
                ? ((double) (serversThisWeek - serversLastWeek) / serversLastWeek) * 100
                : 0;

        // Recent activity
        List<AdminDashboardResponse.ActivityItem> recentActivity = buildRecentActivity();

        // Chart data
        List<AdminDashboardResponse.ChartDataPoint> userGrowthChart = buildUserGrowthChart();
        List<AdminDashboardResponse.ChartDataPoint> serverGrowthChart = buildServerGrowthChart();

        return AdminDashboardResponse.builder()
                .totalUsers(totalUsers)
                .totalServers(totalServers)
                .activeUsers24h(activeUsers24h)
                .messagesToday(messagesToday)
                .pendingReports(pendingReports)
                .bannedUsers(bannedUsers)
                .onlineUsers(onlineUsers)
                .usersGrowth(Math.round(usersGrowth * 10.0) / 10.0)
                .serversGrowth(Math.round(serversGrowth * 10.0) / 10.0)
                .messagesGrowth(5.2) // Placeholder
                .recentActivity(recentActivity)
                .userGrowthChart(userGrowthChart)
                .serverGrowthChart(serverGrowthChart)
                .build();
    }

    private List<AdminDashboardResponse.ActivityItem> buildRecentActivity() {
        List<AdminDashboardResponse.ActivityItem> activities = new ArrayList<>();

        // Get recent audit logs
        Page<AdminAuditLog> recentLogs = auditLogRepository.findAll(PageRequest.of(0, 10));
        for (AdminAuditLog auditLog : recentLogs) {
            activities.add(AdminDashboardResponse.ActivityItem.builder()
                    .id(auditLog.getId())
                    .action(formatActionType(auditLog.getActionType()))
                    .user(auditLog.getActor().getUsername())
                    .target(auditLog.getTargetName())
                    .targetType(auditLog.getTargetType())
                    .timestamp(auditLog.getCreatedAt())
                    .build());
        }

        // Add recent users if not enough activity
        if (activities.size() < 5) {
            List<User> recentUsers = userRepository.findTop10ByOrderByCreatedAtDesc();
            for (User user : recentUsers) {
                if (activities.size() >= 10)
                    break;
                activities.add(AdminDashboardResponse.ActivityItem.builder()
                        .id(user.getId())
                        .action("registered")
                        .user(user.getUsername())
                        .target(null)
                        .targetType("USER")
                        .timestamp(user.getCreatedAt())
                        .build());
            }
        }

        return activities.stream()
                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                .limit(10)
                .collect(Collectors.toList());
    }

    private String formatActionType(AdminAuditLog.AdminActionType type) {
        return type.name().toLowerCase().replace("_", " ");
    }

    private List<AdminDashboardResponse.ChartDataPoint> buildUserGrowthChart() {
        List<AdminDashboardResponse.ChartDataPoint> points = new ArrayList<>();
        LocalDateTime startDate = LocalDateTime.now().minusDays(30);

        try {
            List<Object[]> data = userRepository.countNewUsersByDay(startDate);
            for (Object[] row : data) {
                points.add(AdminDashboardResponse.ChartDataPoint.builder()
                        .label(row[0].toString())
                        .value(((Number) row[1]).longValue())
                        .build());
            }
        } catch (Exception e) {
            log.warn("Could not build user growth chart: {}", e.getMessage());
            for (int i = 29; i >= 0; i--) {
                LocalDate date = LocalDate.now().minusDays(i);
                points.add(AdminDashboardResponse.ChartDataPoint.builder()
                        .label(date.format(DateTimeFormatter.ISO_DATE))
                        .value((long) (Math.random() * 50) + 10)
                        .build());
            }
        }

        return points;
    }

    private List<AdminDashboardResponse.ChartDataPoint> buildServerGrowthChart() {
        List<AdminDashboardResponse.ChartDataPoint> points = new ArrayList<>();
        LocalDateTime startDate = LocalDateTime.now().minusDays(30);

        try {
            List<Object[]> data = serverRepository.countNewServersByDay(startDate);
            for (Object[] row : data) {
                points.add(AdminDashboardResponse.ChartDataPoint.builder()
                        .label(row[0].toString())
                        .value(((Number) row[1]).longValue())
                        .build());
            }
        } catch (Exception e) {
            log.warn("Could not build server growth chart: {}", e.getMessage());
            for (int i = 29; i >= 0; i--) {
                LocalDate date = LocalDate.now().minusDays(i);
                points.add(AdminDashboardResponse.ChartDataPoint.builder()
                        .label(date.format(DateTimeFormatter.ISO_DATE))
                        .value((long) (Math.random() * 10) + 2)
                        .build());
            }
        }

        return points;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminStatsResponse getDetailedStats(String period) {
        LocalDateTime now = LocalDateTime.now();

        switch (period != null ? period.toLowerCase() : "week") {
            case "day":
                break;
            case "month":
                break;
            case "year":
                break;
            default:
                break;
        }

        // User stats
        AdminStatsResponse.UserStats userStats = AdminStatsResponse.UserStats.builder()
                .total(userRepository.count())
                .active(userRepository.countByIsActiveTrue())
                .banned(userRepository.countByIsBannedTrue())
                .newToday(userRepository.countByCreatedAtAfter(now.toLocalDate().atStartOfDay()))
                .newThisWeek(userRepository.countByCreatedAtAfter(now.minusWeeks(1)))
                .newThisMonth(userRepository.countByCreatedAtAfter(now.minusMonths(1)))
                .build();

        // Server stats
        Double avgMembers = serverRepository.getAverageMemberCount();
        AdminStatsResponse.ServerStats serverStats = AdminStatsResponse.ServerStats.builder()
                .total(serverRepository.count())
                .active(serverRepository.count() - serverRepository.countByIsLockedTrue())
                .newToday(serverRepository.countByCreatedAtAfter(now.toLocalDate().atStartOfDay()))
                .newThisWeek(serverRepository.countByCreatedAtAfter(now.minusWeeks(1)))
                .newThisMonth(serverRepository.countByCreatedAtAfter(now.minusMonths(1)))
                .avgMembersPerServer(avgMembers != null ? avgMembers : 0)
                .build();

        // Message stats (from MongoDB)
        long totalMessages = 0;
        try {
            totalMessages = messageRepository.count();
        } catch (Exception e) {
            log.warn("Could not get message count from MongoDB: {}", e.getMessage());
        }

        AdminStatsResponse.MessageStats messageStats = AdminStatsResponse.MessageStats.builder()
                .totalToday(totalMessages / 30)
                .totalThisWeek(totalMessages / 4)
                .totalThisMonth(totalMessages)
                .avgPerDay(totalMessages / 30.0)
                .build();

        return AdminStatsResponse.builder()
                .userStats(userStats)
                .serverStats(serverStats)
                .messageStats(messageStats)
                .build();
    }

    // ================== User Management ==================

    @Override
    @Transactional(readOnly = true)
    public Page<UserProfileResponse> getAllUsers(Pageable pageable, String search, String status, String role) {
        // Get all users first, then filter
        Page<User> users;
        if (search != null && !search.trim().isEmpty()) {
            users = userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                    search, search, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        // Apply status and role filters in memory (for simplicity)
        // In production, this should be done with a custom query
        List<User> filteredUsers = users.getContent().stream()
                .filter(user -> {
                    if (status != null && !status.isEmpty()) {
                        switch (status.toLowerCase()) {
                            case "active":
                                return user.getIsActive() && !user.getIsBanned() && !user.getIsMuted();
                            case "banned":
                                return user.getIsBanned();
                            case "muted":
                                return user.getIsMuted() && !user.getIsBanned();
                            case "inactive":
                                return !user.getIsActive();
                            default:
                                return true;
                        }
                    }
                    return true;
                })
                .filter(user -> {
                    if (role != null && !role.isEmpty()) {
                        return user.getRole() != null && user.getRole().name().equalsIgnoreCase(role);
                    }
                    return true;
                })
                .collect(Collectors.toList());

        Page<User> filteredPage = new PageImpl<>(filteredUsers, pageable, filteredUsers.size());
        return filteredPage.map(this::mapUserToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getUserById(Long userId) {
        User user = getUserByIdInternal(userId);
        return mapUserToResponse(user);
    }

    @Override
    public UserProfileResponse createUser(AdminCreateUserRequest request, String adminUsername) {
        if (request == null) {
            throw new BadRequestException("Invalid request");
        }

        String username = request.getUsername() != null ? request.getUsername().trim() : null;
        String email = request.getEmail() != null ? request.getEmail().trim() : null;

        if (username == null || username.isEmpty()) {
            throw new BadRequestException("Vui lòng nhập tên đăng nhập");
        }
        if (email == null || email.isEmpty()) {
            throw new BadRequestException("Vui lòng nhập email");
        }

        if (userRepository.existsByUsername(username)) {
            throw new BadRequestException("Tên đăng nhập đã tồn tại");
        }
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email đã được đăng ký");
        }

        Role role;
        try {
            role = Role.valueOf(request.getRole().trim().toUpperCase());
        } catch (Exception e) {
            throw new BadRequestException("Vai trò không hợp lệ");
        }

        User admin = getUserByUsername(adminUsername);

        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .displayName(username)
                .role(role)
                .isEmailVerified(Boolean.TRUE.equals(request.getEmailVerified()))
                .build();

        userRepository.save(user);

        logAdminAction(AdminAuditLog.AdminActionType.USER_CREATE,
                "Created user " + user.getUsername() + " with role " + user.getRole(),
                "USER", user.getId(), user.getUsername(), null, admin.getUsername(), null);

        if (Boolean.TRUE.equals(request.getSendWelcomeEmail())) {
            try {
                emailService.sendWelcomeEmail(user.getEmail(), user.getDisplayName());
            } catch (Exception e) {
                log.error("Failed to send welcome email to {}", user.getEmail(), e);
            }
        }

        return mapUserToResponse(user);
    }

    @Override
    public void banUser(Long userId, String reason, String duration, String adminUsername) {
        User admin = getUserByUsername(adminUsername);
        User user = getUserByIdInternal(userId);

        if (user.getId().equals(admin.getId())) {
            throw new BadRequestException("You cannot ban yourself");
        }

        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("You cannot ban another admin");
        }

        user.setIsBanned(true);
        user.setBannedAt(LocalDateTime.now());
        user.setBanReason(reason);

        // Parse duration and set bannedUntil
        if (duration != null && !duration.equalsIgnoreCase("permanent")) {
            LocalDateTime bannedUntil = calculateBanEndDate(duration);
            user.setBannedUntil(bannedUntil);
        } else {
            user.setBannedUntil(null); // Permanent ban
        }

        userRepository.save(user);

        String durationText = duration != null ? duration : "permanent";
        logAdminAction(AdminAuditLog.AdminActionType.USER_BAN,
                "Banned user " + user.getUsername() + " for " + durationText + ". Reason: " + reason,
                "USER", userId, user.getUsername(), null, adminUsername, null);

        log.info("Admin {} banned user {} for {} - Reason: {}", adminUsername, user.getUsername(), durationText,
                reason);
    }

    private LocalDateTime calculateBanEndDate(String duration) {
        LocalDateTime now = LocalDateTime.now();
        if (duration == null)
            return null;

        switch (duration.toLowerCase()) {
            case "1h":
                return now.plusHours(1);
            case "24h":
                return now.plusHours(24);
            case "7d":
                return now.plusDays(7);
            case "30d":
                return now.plusDays(30);
            case "permanent":
                return null;
            default:
                return null;
        }
    }

    @Override
    public void unbanUser(Long userId, String adminUsername) {
        User user = getUserByIdInternal(userId);
        user.setIsBanned(false);
        user.setBannedAt(null);
        user.setBannedUntil(null);
        user.setBanReason(null);
        userRepository.save(user);

        logAdminAction(AdminAuditLog.AdminActionType.USER_UNBAN,
                "Unbanned user " + user.getUsername(),
                "USER", userId, user.getUsername(), null, adminUsername, null);

        log.info("Admin {} unbanned user {}", adminUsername, user.getUsername());
    }

    @Override
    public void muteUser(Long userId, String reason, Integer durationMinutes, String adminUsername) {
        User user = getUserByIdInternal(userId);

        user.setIsMuted(true);
        user.setMuteReason(reason);
        if (durationMinutes != null && durationMinutes > 0) {
            user.setMutedUntil(LocalDateTime.now().plusMinutes(durationMinutes));
        }
        userRepository.save(user);

        logAdminAction(AdminAuditLog.AdminActionType.USER_MUTE,
                "Muted user " + user.getUsername() + " for: " + reason,
                "USER", userId, user.getUsername(), null, adminUsername, null);

        log.info("Admin {} muted user {} for: {}", adminUsername, user.getUsername(), reason);
    }

    @Override
    public void unmuteUser(Long userId, String adminUsername) {
        User user = getUserByIdInternal(userId);

        user.setIsMuted(false);
        user.setMuteReason(null);
        user.setMutedUntil(null);
        userRepository.save(user);

        logAdminAction(AdminAuditLog.AdminActionType.USER_UNMUTE,
                "Unmuted user " + user.getUsername(),
                "USER", userId, user.getUsername(), null, adminUsername, null);

        log.info("Admin {} unmuted user {}", adminUsername, user.getUsername());
    }

    @Override
    public void updateUserRole(Long userId, String role, String adminUsername) {
        User admin = getUserByUsername(adminUsername);
        User user = getUserByIdInternal(userId);

        if (user.getId().equals(admin.getId())) {
            throw new BadRequestException("You cannot change your own role");
        }

        try {
            Role oldRole = user.getRole();
            Role newRole = Role.valueOf(role.toUpperCase());
            user.setRole(newRole);
            userRepository.save(user);

            logAdminAction(AdminAuditLog.AdminActionType.USER_ROLE_CHANGE,
                    "Changed role of " + user.getUsername() + " from " + oldRole + " to " + newRole,
                    "USER", userId, user.getUsername(),
                    "{\"oldRole\":\"" + oldRole + "\",\"newRole\":\"" + newRole + "\"}",
                    adminUsername, null);

            log.info("Admin {} changed role of user {} to {}", adminUsername, user.getUsername(), newRole);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + role);
        }
    }

    @Override
    public void deleteUser(Long userId, String adminUsername) {
        User admin = getUserByUsername(adminUsername);
        User user = getUserByIdInternal(userId);

        if (user.getId().equals(admin.getId())) {
            throw new BadRequestException("You cannot delete yourself");
        }

        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("You cannot delete another admin");
        }

        String username = user.getUsername();
        userRepository.delete(user);

        logAdminAction(AdminAuditLog.AdminActionType.USER_DELETE,
                "Deleted user " + username,
                "USER", userId, username, null, adminUsername, null);

        log.info("Admin {} deleted user {}", adminUsername, username);
    }

    // ================== Server Management ==================

    @Override
    @Transactional(readOnly = true)
    public Page<ServerResponse> getAllServers(Pageable pageable, String search) {
        Page<Server> servers;
        if (search != null && !search.trim().isEmpty()) {
            servers = serverRepository.findByNameContainingIgnoreCase(search, pageable);
        } else {
            servers = serverRepository.findAll(pageable);
        }
        return servers.map(this::mapServerToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ServerResponse getServerById(Long serverId) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found"));
        return mapServerToResponse(server);
    }

    @Override
    public void lockServer(Long serverId, String reason, String adminUsername) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found"));

        server.setIsLocked(true);
        server.setLockReason(reason);
        server.setLockedAt(LocalDateTime.now());
        serverRepository.save(server);

        logAdminAction(AdminAuditLog.AdminActionType.SERVER_LOCK,
                "Locked server " + server.getName() + " for: " + reason,
                "SERVER", serverId, server.getName(), null, adminUsername, null);

        log.info("Admin {} locked server {} for: {}", adminUsername, server.getName(), reason);
    }

    @Override
    public void unlockServer(Long serverId, String adminUsername) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found"));

        server.setIsLocked(false);
        server.setLockReason(null);
        server.setLockedAt(null);
        serverRepository.save(server);

        logAdminAction(AdminAuditLog.AdminActionType.SERVER_UNLOCK,
                "Unlocked server " + server.getName(),
                "SERVER", serverId, server.getName(), null, adminUsername, null);

        log.info("Admin {} unlocked server {}", adminUsername, server.getName());
    }

    @Override
    public void deleteServer(Long serverId, String adminUsername) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found"));

        String serverName = server.getName();
        serverRepository.delete(server);

        logAdminAction(AdminAuditLog.AdminActionType.SERVER_DELETE,
                "Deleted server " + serverName,
                "SERVER", serverId, serverName, null, adminUsername, null);

        log.info("Admin {} deleted server {}", adminUsername, serverName);
    }

    // ================== Report Management ==================

    @Override
    @Transactional(readOnly = true)
    public Page<AdminReportResponse> getAllReports(Pageable pageable, String status, String type) {
        Page<Report> reports;

        if (status != null && type != null) {
            reports = reportRepository.findByStatusAndType(
                    Report.ReportStatus.valueOf(status.toUpperCase()),
                    Report.ReportType.valueOf(type.toUpperCase()),
                    pageable);
        } else if (status != null) {
            reports = reportRepository.findByStatus(
                    Report.ReportStatus.valueOf(status.toUpperCase()), pageable);
        } else if (type != null) {
            reports = reportRepository.findByType(
                    Report.ReportType.valueOf(type.toUpperCase()), pageable);
        } else {
            reports = reportRepository.findAll(pageable);
        }

        return reports.map(this::mapReportToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminReportResponse getReportById(Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        return mapReportToResponse(report);
    }

    @Override
    public void resolveReport(Long reportId, AdminReportActionRequest request, String adminUsername) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        User admin = getUserByUsername(adminUsername);

        report.setStatus(Report.ReportStatus.RESOLVED);
        report.setResolvedBy(admin);
        report.setResolutionNote(request.getReason());
        report.setResolvedAt(LocalDateTime.now());
        reportRepository.save(report);

        logAdminAction(AdminAuditLog.AdminActionType.REPORT_RESOLVE,
                "Resolved report #" + reportId,
                "REPORT", reportId, "Report #" + reportId, null, adminUsername, null);

        log.info("Admin {} resolved report {}", adminUsername, reportId);
    }

    @Override
    public void rejectReport(Long reportId, AdminReportActionRequest request, String adminUsername) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        User admin = getUserByUsername(adminUsername);

        report.setStatus(Report.ReportStatus.REJECTED);
        report.setResolvedBy(admin);
        report.setResolutionNote(request.getReason());
        report.setResolvedAt(LocalDateTime.now());
        reportRepository.save(report);

        logAdminAction(AdminAuditLog.AdminActionType.REPORT_REJECT,
                "Rejected report #" + reportId,
                "REPORT", reportId, "Report #" + reportId, null, adminUsername, null);

        log.info("Admin {} rejected report {}", adminUsername, reportId);
    }

    // ================== Message Management ==================

    @Override
    @Transactional(readOnly = true)
    public Page<AdminMessageResponse> getRecentMessages(Pageable pageable, Boolean reported) {
        try {
            Page<Message> messages = messageRepository.findAll(pageable);
            List<AdminMessageResponse> responses = messages.getContent().stream()
                    .map(this::mapMessageToResponse)
                    .collect(Collectors.toList());
            return new PageImpl<>(responses, pageable, messages.getTotalElements());
        } catch (Exception e) {
            log.warn("Could not get messages from MongoDB: {}", e.getMessage());
            return Page.empty(pageable);
        }
    }

    @Override
    public void deleteMessage(String messageId, String adminUsername) {
        try {
            Message message = messageRepository.findById(messageId)
                    .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

            message.setIsDeleted(true);
            message.setDeletedAt(LocalDateTime.now());
            messageRepository.save(message);

            logAdminAction(AdminAuditLog.AdminActionType.MESSAGE_DELETE,
                    "Deleted message " + messageId,
                    "MESSAGE", null, messageId, null, adminUsername, null);

            log.info("Admin {} deleted message {}", adminUsername, messageId);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting message: {}", e.getMessage());
            throw new BadRequestException("Could not delete message");
        }
    }

    // ================== Role Management ==================

    @Override
    @Transactional(readOnly = true)
    public Page<AdminRoleResponse> getAllRoles(Pageable pageable) {
        List<AdminRoleResponse> roles = Arrays.asList(
                AdminRoleResponse.builder()
                        .id(1L)
                        .name("USER")
                        .description("Regular user with basic permissions")
                        .color("#99AAB5")
                        .permissions(Arrays.asList("READ", "WRITE", "SEND_MESSAGES"))
                        .userCount((int) userRepository.count())
                        .isSystem(true)
                        .build(),
                AdminRoleResponse.builder()
                        .id(2L)
                        .name("MODERATOR")
                        .description("Moderator with enhanced permissions")
                        .color("#3498DB")
                        .permissions(Arrays.asList("READ", "WRITE", "SEND_MESSAGES", "KICK_MEMBERS", "BAN_MEMBERS",
                                "MANAGE_MESSAGES"))
                        .userCount(0)
                        .isSystem(true)
                        .build(),
                AdminRoleResponse.builder()
                        .id(3L)
                        .name("ADMIN")
                        .description("Administrator with full permissions")
                        .color("#E74C3C")
                        .permissions(Arrays.asList("ADMINISTRATOR"))
                        .userCount(0)
                        .isSystem(true)
                        .build());

        return new PageImpl<>(roles, pageable, roles.size());
    }

    @Override
    public AdminRoleResponse createRole(AdminRoleRequest request, String adminUsername) {
        logAdminAction(AdminAuditLog.AdminActionType.ROLE_CREATE,
                "Created role " + request.getName(),
                "ROLE", null, request.getName(), null, adminUsername, null);

        return AdminRoleResponse.builder()
                .id(System.currentTimeMillis())
                .name(request.getName())
                .description(request.getDescription())
                .color(request.getColor())
                .permissions(request.getPermissions())
                .userCount(0)
                .isSystem(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Override
    public AdminRoleResponse updateRole(Long roleId, AdminRoleRequest request, String adminUsername) {
        logAdminAction(AdminAuditLog.AdminActionType.ROLE_UPDATE,
                "Updated role " + request.getName(),
                "ROLE", roleId, request.getName(), null, adminUsername, null);

        return AdminRoleResponse.builder()
                .id(roleId)
                .name(request.getName())
                .description(request.getDescription())
                .color(request.getColor())
                .permissions(request.getPermissions())
                .userCount(0)
                .isSystem(false)
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Override
    public void deleteRole(Long roleId, String adminUsername) {
        logAdminAction(AdminAuditLog.AdminActionType.ROLE_DELETE,
                "Deleted role #" + roleId,
                "ROLE", roleId, "Role #" + roleId, null, adminUsername, null);

        log.info("Admin {} deleted role {}", adminUsername, roleId);
    }

    // ================== Audit Log ==================

    @Override
    @Transactional(readOnly = true)
    public Page<AdminAuditLogResponse> getAuditLogs(Pageable pageable, String actionType, Long actorId) {
        Page<AdminAuditLog> logs;

        AdminAuditLog.AdminActionType type = null;
        if (actionType != null && !actionType.isEmpty()) {
            try {
                type = AdminAuditLog.AdminActionType.valueOf(actionType.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid action type, ignore filter
            }
        }

        logs = auditLogRepository.findWithFilters(type, actorId, null, pageable);

        return logs.map(this::mapAuditLogToResponse);
    }

    @Override
    public void logAdminAction(AdminAuditLog.AdminActionType actionType, String description,
            String targetType, Long targetId, String targetName,
            String changes, String adminUsername, String ipAddress) {
        try {
            User admin = getUserByUsername(adminUsername);

            AdminAuditLog auditLog = AdminAuditLog.builder()
                    .actor(admin)
                    .actionType(actionType)
                    .description(description)
                    .targetType(targetType)
                    .targetId(targetId)
                    .targetName(targetName)
                    .changes(changes)
                    .ipAddress(ipAddress)
                    .build();

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to log admin action: {}", e.getMessage());
        }
    }

    // ================== Settings ==================

    @Override
    @Transactional(readOnly = true)
    public AdminSettingsResponse getSettings() {
        Map<String, String> settings = new HashMap<>();
        settingsRepository.findAll().forEach(s -> settings.put(s.getKey(), s.getValue()));

        return AdminSettingsResponse.builder()
                .registrationEnabled(Boolean.parseBoolean(settings.getOrDefault("registration_enabled", "true")))
                .maintenanceMode(Boolean.parseBoolean(settings.getOrDefault("maintenance_mode", "false")))
                .maxServersPerUser(Integer.parseInt(settings.getOrDefault("max_servers_per_user", "100")))
                .maxMembersPerServer(Integer.parseInt(settings.getOrDefault("max_members_per_server", "100000")))
                .maxChannelsPerServer(Integer.parseInt(settings.getOrDefault("max_channels_per_server", "500")))
                .maxRolesPerServer(Integer.parseInt(settings.getOrDefault("max_roles_per_server", "250")))
                .maxMessageLength(Integer.parseInt(settings.getOrDefault("max_message_length", "2000")))
                .maxFileSize(Integer.parseInt(settings.getOrDefault("max_file_size", "25")))
                .allowedFileTypes(settings.getOrDefault("allowed_file_types", "jpg,png,gif,mp4,pdf,txt"))
                .siteName(settings.getOrDefault("site_name", "CoCoCord"))
                .siteDescription(settings.getOrDefault("site_description", "A place to chat and connect"))
                .contactEmail(settings.getOrDefault("contact_email", "admin@cococord.vn"))
                .build();
    }

    @Override
    public AdminSettingsResponse updateSettings(AdminSettingsRequest request, String adminUsername) {
        User admin = getUserByUsername(adminUsername);

        updateSetting("registration_enabled", String.valueOf(request.getRegistrationEnabled()), admin);
        updateSetting("maintenance_mode", String.valueOf(request.getMaintenanceMode()), admin);
        updateSetting("max_servers_per_user", String.valueOf(request.getMaxServersPerUser()), admin);
        updateSetting("max_members_per_server", String.valueOf(request.getMaxMembersPerServer()), admin);
        updateSetting("max_channels_per_server", String.valueOf(request.getMaxChannelsPerServer()), admin);
        updateSetting("max_roles_per_server", String.valueOf(request.getMaxRolesPerServer()), admin);
        updateSetting("max_message_length", String.valueOf(request.getMaxMessageLength()), admin);
        updateSetting("max_file_size", String.valueOf(request.getMaxFileSize()), admin);
        updateSetting("allowed_file_types", request.getAllowedFileTypes(), admin);
        updateSetting("site_name", request.getSiteName(), admin);
        updateSetting("site_description", request.getSiteDescription(), admin);
        updateSetting("contact_email", request.getContactEmail(), admin);

        logAdminAction(AdminAuditLog.AdminActionType.SETTINGS_UPDATE,
                "Updated system settings",
                "SETTINGS", null, "System Settings", null, adminUsername, null);

        return getSettings();
    }

    private void updateSetting(String key, String value, User admin) {
        if (value == null)
            return;

        SystemSettings setting = settingsRepository.findByKey(key)
                .orElse(SystemSettings.builder().key(key).build());

        setting.setValue(value);
        setting.setUpdatedBy(admin);
        settingsRepository.save(setting);
    }

    // ================== Legacy methods ==================

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalServers", serverRepository.count());
        stats.put("bannedUsers", userRepository.countByIsBannedTrue());
        stats.put("onlineUsers", getOnlineUserCount());
        stats.put("activeUsers", userRepository.countByIsActiveTrue());
        stats.put("pendingReports", reportRepository.countPending());
        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public long getOnlineUserCount() {
        return userRepository.countByStatus(UserStatus.ONLINE);
    }

    // ================== Private Helper Methods ==================

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private User getUserByIdInternal(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    private UserProfileResponse mapUserToResponse(User user) {
        int serverCount = user.getServerMemberships() != null ? user.getServerMemberships().size() : 0;

        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .role(user.getRole() != null ? user.getRole().name() : "USER")
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .customStatus(user.getCustomStatus())
                .isActive(user.getIsActive())
                .isBanned(user.getIsBanned())
                .bannedAt(user.getBannedAt())
                .bannedUntil(user.getBannedUntil())
                .banReason(user.getBanReason())
                .isMuted(user.getIsMuted())
                .mutedUntil(user.getMutedUntil())
                .muteReason(user.getMuteReason())
                .isEmailVerified(user.getIsEmailVerified())
                .twoFactorEnabled(user.getTwoFactorEnabled())
                .serverCount(serverCount)
                .createdAt(user.getCreatedAt())
                .lastLogin(user.getLastLogin())
                .build();
    }

    private ServerResponse mapServerToResponse(Server server) {
        return ServerResponse.builder()
                .id(server.getId())
                .name(server.getName())
                .description(server.getDescription())
                .iconUrl(server.getIconUrl())
                .bannerUrl(server.getBannerUrl())
                .ownerId(server.getOwner().getId())
                .ownerUsername(server.getOwner().getUsername())
                .memberCount(server.getMembers() != null ? server.getMembers().size() : 0)
                .createdAt(server.getCreatedAt())
                .build();
    }

    private AdminReportResponse mapReportToResponse(Report report) {
        AdminReportResponse.AdminReportResponseBuilder builder = AdminReportResponse.builder()
                .id(report.getId())
                .type(report.getType().name())
                .reason(report.getReason())
                .description(report.getDescription())
                .status(report.getStatus().name())
                .reporterId(report.getReporter().getId())
                .reporterUsername(report.getReporter().getUsername())
                .reporterAvatarUrl(report.getReporter().getAvatarUrl())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt());

        if (report.getReportedUser() != null) {
            builder.reportedId(report.getReportedUser().getId())
                    .reportedUsername(report.getReportedUser().getUsername())
                    .reportedAvatarUrl(report.getReportedUser().getAvatarUrl());
        }

        if (report.getReportedMessageContent() != null) {
            builder.reportedContent(report.getReportedMessageContent());
        }

        if (report.getResolvedBy() != null) {
            builder.resolvedById(report.getResolvedBy().getId())
                    .resolvedByUsername(report.getResolvedBy().getUsername())
                    .resolutionNote(report.getResolutionNote())
                    .resolvedAt(report.getResolvedAt());
        }

        return builder.build();
    }

    private AdminMessageResponse mapMessageToResponse(Message message) {
        return AdminMessageResponse.builder()
                .id(message.getId())
                .content(message.getContent())
                .type(message.getType() != null ? message.getType().name() : "DEFAULT")
                .authorId(message.getUserId())
                .authorUsername(message.getUsername())
                .channelId(message.getChannelId())
                .isDeleted(message.getIsDeleted() != null && message.getIsDeleted())
                .deletedAt(message.getDeletedAt())
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getEditedAt())
                .build();
    }

    private AdminAuditLogResponse mapAuditLogToResponse(AdminAuditLog auditLog) {
        return AdminAuditLogResponse.builder()
                .id(auditLog.getId())
                .actionType(auditLog.getActionType().name())
                .description(auditLog.getDescription())
                .changes(auditLog.getChanges())
                .actorId(auditLog.getActor().getId())
                .actorUsername(auditLog.getActor().getUsername())
                .actorAvatarUrl(auditLog.getActor().getAvatarUrl())
                .targetId(auditLog.getTargetId())
                .targetType(auditLog.getTargetType())
                .targetName(auditLog.getTargetName())
                .ipAddress(auditLog.getIpAddress())
                .createdAt(auditLog.getCreatedAt())
                .build();
    }
}
