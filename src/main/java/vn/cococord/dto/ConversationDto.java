package vn.cococord.dto;

import java.util.List;

public class ConversationDto {
    private Long id;
    private String type;
    private String name;
    private List<FriendDto> participants;

    public ConversationDto() {
    }

    public ConversationDto(Long id, String type, String name, List<FriendDto> participants) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.participants = participants;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<FriendDto> getParticipants() {
        return participants;
    }

    public void setParticipants(List<FriendDto> participants) {
        this.participants = participants;
    }
}