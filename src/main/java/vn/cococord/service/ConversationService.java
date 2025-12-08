package vn.cococord.service;

import vn.cococord.dto.ConversationDto;
import vn.cococord.dto.FriendDto;
import vn.cococord.entity.*;
import vn.cococord.repository.ConversationParticipantRepository;
import vn.cococord.repository.ConversationRepository;
import vn.cococord.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class ConversationService {
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository conversationParticipantRepository;
    private final UserRepository userRepository;

    public ConversationService(ConversationRepository conversationRepository,
                               ConversationParticipantRepository conversationParticipantRepository,
                               UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.conversationParticipantRepository = conversationParticipantRepository;
        this.userRepository = userRepository;
    }

    public Conversation createConversation(User creator, List<String> usernames, String name) {
        Set<String> unique = usernames.stream().filter(u -> !u.equalsIgnoreCase(creator.getUsername())).collect(Collectors.toSet());
        if (unique.isEmpty()) {
            throw new RuntimeException("At least one other participant required");
        }
        if (unique.size() > 9) {
            throw new RuntimeException("Too many participants");
        }
        List<User> participants = new ArrayList<>();
        participants.add(creator);
        for (String username : unique) {
            User u = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
            participants.add(u);
        }
        Conversation conversation = new Conversation();
        if (participants.size() == 2) {
            conversation.setType(ConversationType.DM);
            conversation.setName(null);
        } else {
            conversation.setType(ConversationType.GROUP_DM);
            conversation.setName(name);
        }
        conversation.setCreatedBy(creator);
        conversation = conversationRepository.save(conversation);
        for (User u : participants) {
            ConversationParticipant cp = new ConversationParticipant();
            cp.setConversation(conversation);
            cp.setUser(u);
            cp.setRole(u.getId().equals(creator.getId()) ? ConversationParticipantRole.OWNER : ConversationParticipantRole.MEMBER);
            conversationParticipantRepository.save(cp);
        }
        return conversation;
    }

    public List<Conversation> listConversations(User user) {
        return conversationParticipantRepository.findAll().stream()
                .filter(cp -> cp.getUser().getId().equals(user.getId()))
                .map(ConversationParticipant::getConversation)
                .distinct()
                .collect(Collectors.toList());
    }

    public ConversationDto toDto(Conversation conversation) {
        List<ConversationParticipant> participants = conversationParticipantRepository.findAll().stream()
                .filter(cp -> cp.getConversation().getId().equals(conversation.getId()))
                .collect(Collectors.toList());
        List<FriendDto> participantDtos = participants.stream()
                .map(cp -> {
                    User u = cp.getUser();
                    return new FriendDto(u.getId(), u.getUsername(), u.getDisplayName(), u.getAvatarUrl());
                }).collect(Collectors.toList());
        String type = conversation.getType().name();
        return new ConversationDto(conversation.getId(), type, conversation.getName(), participantDtos);
    }
}