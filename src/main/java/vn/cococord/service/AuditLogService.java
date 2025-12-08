package vn.cococord.service;

import vn.cococord.dto.AuditLogDto;
import vn.cococord.entity.AuditLog;
import vn.cococord.entity.AuditLog.AuditAction;
import vn.cococord.entity.Server;
import vn.cococord.entity.User;
import vn.cococord.repository.AuditLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;

@Service
@Transactional
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditLogService(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    @Async
    public void log(AuditAction action, User user, Server server, String targetType, Long targetId,
            Map<String, Object> details, String ipAddress) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setUser(user);
        log.setServer(server);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setIpAddress(ipAddress);

        if (details != null) {
            try {
                log.setDetails(objectMapper.writeValueAsString(details));
            } catch (JsonProcessingException e) {
                log.setDetails("{}");
            }
        }

        auditLogRepository.save(log);
    }

    public void log(AuditAction action, User user, String ipAddress) {
        log(action, user, null, null, null, null, ipAddress);
    }

    public void log(AuditAction action, User user, Server server, String ipAddress) {
        log(action, user, server, "SERVER", server.getId(), null, ipAddress);
    }

    public Page<AuditLogDto> getServerAuditLogs(Server server, int page, int size) {
        Page<AuditLog> logs = auditLogRepository.findByServer(server,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return logs.map(this::toDto);
    }

    public Page<AuditLogDto> getAllAuditLogs(int page, int size) {
        Page<AuditLog> logs = auditLogRepository.findAllByOrderByCreatedAtDesc(
                PageRequest.of(page, size));
        return logs.map(this::toDto);
    }

    private AuditLogDto toDto(AuditLog log) {
        AuditLogDto dto = new AuditLogDto();
        dto.setId(log.getId());
        dto.setAction(log.getAction().name());
        dto.setUsername(log.getUser() != null ? log.getUser().getUsername() : null);
        dto.setServerName(log.getServer() != null ? log.getServer().getName() : null);
        dto.setTargetType(log.getTargetType());
        dto.setTargetId(log.getTargetId());
        dto.setDetails(log.getDetails());
        dto.setIpAddress(log.getIpAddress());
        dto.setCreatedAt(log.getCreatedAt());
        return dto;
    }
}
