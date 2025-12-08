package vn.cococord.controller;

import vn.cococord.dto.ChannelDto;
import vn.cococord.entity.Channel;
import vn.cococord.entity.ChannelType;
import vn.cococord.entity.Server;
import vn.cococord.entity.User;
import vn.cococord.repository.ServerRepository;
import vn.cococord.service.ChannelService;
import vn.cococord.service.ServerService;
import vn.cococord.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/servers/{serverId}/channels")
public class ChannelController {
    private final ChannelService channelService;
    private final ServerRepository serverRepository;
    private final UserService userService;
    public ChannelController(ChannelService channelService, ServerRepository serverRepository, UserService userService) {
        this.channelService = channelService;
        this.serverRepository = serverRepository;
        this.userService = userService;
    }
    @GetMapping
    public ResponseEntity<List<ChannelDto>> listChannels(@PathVariable Long serverId, Principal principal) {
        Server server = serverRepository.findById(serverId).orElseThrow();
        List<Channel> channels = channelService.listChannels(server);
        List<ChannelDto> dtos = channels.stream().map(channelService::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    @PostMapping
    public ResponseEntity<ChannelDto> createChannel(@PathVariable Long serverId, @RequestBody Map<String, String> body, Principal principal) {
        Server server = serverRepository.findById(serverId).orElseThrow();
        String name = body.get("name");
        String typeStr = body.getOrDefault("type", "TEXT");
        boolean isPrivate = Boolean.parseBoolean(body.getOrDefault("private", "false"));
        ChannelType type = ChannelType.valueOf(typeStr);
        Channel channel = channelService.createChannel(server, name, type, isPrivate, null);
        return ResponseEntity.ok(channelService.toDto(channel));
    }
}
