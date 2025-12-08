package vn.cococord.dto;

import lombok.Data;

@Data
public class ServerMemberDto {
    private Long id;
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String status;
    private String roleNames;
    private boolean isOwner;
    private boolean isAdmin;
}
