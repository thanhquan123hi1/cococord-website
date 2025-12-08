package vn.cococord.service;

import vn.cococord.dto.ChannelDto;
import vn.cococord.entity.Channel;
import vn.cococord.entity.ChannelType;
import vn.cococord.entity.Category;
import vn.cococord.entity.Server;
import vn.cococord.repository.ChannelRepository;
import vn.cococord.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ChannelService {
    private final ChannelRepository channelRepository;
    private final CategoryRepository categoryRepository;
    public ChannelService(ChannelRepository channelRepository, CategoryRepository categoryRepository) {
        this.channelRepository = channelRepository;
        this.categoryRepository = categoryRepository;
    }
    public Channel createChannel(Server server, String name, ChannelType type, boolean isPrivate, Category category) {
        Channel channel = new Channel();
        channel.setServer(server);
        channel.setName(name);
        channel.setType(type);
        channel.setPrivate(isPrivate);
        channel.setCategory(category);
        return channelRepository.save(channel);
    }
    public List<Channel> listChannels(Server server) {
        return channelRepository.findByServer(server);
    }
    public ChannelDto toDto(Channel channel) {
        return new ChannelDto(channel.getId(), channel.getName(), channel.getType());
    }
}
