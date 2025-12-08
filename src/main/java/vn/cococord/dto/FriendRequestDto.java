package vn.cococord.dto;

import vn.cococord.entity.FriendRequestStatus;

public class FriendRequestDto {
    private Long id;
    private String fromUsername;
    private String toUsername;
    private FriendRequestStatus status;

    public FriendRequestDto() {
    }

    public FriendRequestDto(Long id, String fromUsername, String toUsername, FriendRequestStatus status) {
        this.id = id;
        this.fromUsername = fromUsername;
        this.toUsername = toUsername;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFromUsername() {
        return fromUsername;
    }

    public void setFromUsername(String fromUsername) {
        this.fromUsername = fromUsername;
    }

    public String getToUsername() {
        return toUsername;
    }

    public void setToUsername(String toUsername) {
        this.toUsername = toUsername;
    }

    public FriendRequestStatus getStatus() {
        return status;
    }

    public void setStatus(FriendRequestStatus status) {
        this.status = status;
    }
}