package vn.cococord.dto;

import vn.cococord.entity.ChannelType;

public class ChannelDto {
    private Long id;
    private String name;
    private ChannelType type;
    public ChannelDto() {
    }
    public ChannelDto(Long id, String name, ChannelType type) {
        this.id = id;
        this.name = name;
        this.type = type;
    }
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public ChannelType getType() {
        return type;
    }
    public void setType(ChannelType type) {
        this.type = type;
    }
}
