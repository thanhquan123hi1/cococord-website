package vn.cococord.entity.mysql;

/**
 * Enum định nghĩa các Permission Bits cho Discord-style permission system
 * Sử dụng bitmask để lưu trữ nhiều permissions trong một Long value
 * 
 * Logic: Mỗi permission có một bit position (0-63)
 * Example: VIEW_CHANNEL = 1L << 0 = 0000...0001
 *          SEND_MESSAGES = 1L << 1 = 0000...0010
 * 
 * Để check permission: (bitmask & SEND_MESSAGES.getValue()) != 0
 * Để grant permission: bitmask |= SEND_MESSAGES.getValue()
 * Để revoke permission: bitmask &= ~SEND_MESSAGES.getValue()
 */
public enum PermissionBit {
    
    // ===== GENERAL PERMISSIONS (0-9) =====
    /**
     * Xem kênh - Base permission để thấy kênh trong danh sách
     * Bitmask: 0x0000000000000001 (bit 0)
     */
    VIEW_CHANNEL(0, "VIEW_CHANNEL", "Xem kênh"),
    
    /**
     * Quản lý kênh - Tạo, sửa, xóa kênh
     * Bitmask: 0x0000000000000002 (bit 1)
     */
    MANAGE_CHANNELS(1, "MANAGE_CHANNELS", "Quản lý kênh"),
    
    // ===== MESSAGE PERMISSIONS (10-19) =====
    /**
     * Gửi tin nhắn trong kênh text
     * Bitmask: 0x0000000000000400 (bit 10)
     */
    SEND_MESSAGES(10, "SEND_MESSAGES", "Gửi tin nhắn"),
    
    /**
     * Gửi tin nhắn trong threads
     * Bitmask: 0x0000000000000800 (bit 11)
     */
    SEND_MESSAGES_IN_THREADS(11, "SEND_MESSAGES_IN_THREADS", "Gửi tin nhắn trong threads"),
    
    /**
     * Nhúng links (auto-embed)
     * Bitmask: 0x0000000000001000 (bit 12)
     */
    EMBED_LINKS(12, "EMBED_LINKS", "Nhúng links"),
    
    /**
     * Đính kèm files
     * Bitmask: 0x0000000000002000 (bit 13)
     */
    ATTACH_FILES(13, "ATTACH_FILES", "Đính kèm files"),
    
    /**
     * Thêm reactions vào tin nhắn
     * Bitmask: 0x0000000000004000 (bit 14)
     */
    ADD_REACTIONS(14, "ADD_REACTIONS", "Thêm reactions"),
    
    /**
     * Sử dụng emoji ngoài (từ server khác)
     * Bitmask: 0x0000000000008000 (bit 15)
     */
    USE_EXTERNAL_EMOJIS(15, "USE_EXTERNAL_EMOJIS", "Dùng emoji ngoài"),
    
    /**
     * Mention @everyone, @here, và all roles
     * Bitmask: 0x0000000000010000 (bit 16)
     */
    MENTION_EVERYONE(16, "MENTION_EVERYONE", "Mention mọi người"),
    
    /**
     * Xem lịch sử tin nhắn (load older messages)
     * Bitmask: 0x0000000000020000 (bit 17)
     */
    READ_MESSAGE_HISTORY(17, "READ_MESSAGE_HISTORY", "Xem lịch sử tin nhắn"),
    
    /**
     * Sử dụng Text-to-Speech
     * Bitmask: 0x0000000000040000 (bit 18)
     */
    USE_TTS(18, "USE_TTS", "Dùng Text-to-Speech"),
    
    /**
     * Quản lý tin nhắn - Xóa tin nhắn của người khác, pin messages
     * Bitmask: 0x0000000000080000 (bit 19)
     */
    MANAGE_MESSAGES(19, "MANAGE_MESSAGES", "Quản lý tin nhắn"),
    
    // ===== VOICE PERMISSIONS (20-29) =====
    /**
     * Kết nối vào kênh voice
     * Bitmask: 0x0000000000100000 (bit 20)
     */
    CONNECT(20, "CONNECT", "Kết nối voice"),
    
    /**
     * Nói trong kênh voice
     * Bitmask: 0x0000000000200000 (bit 21)
     */
    SPEAK(21, "SPEAK", "Nói trong voice"),
    
    /**
     * Bật camera trong kênh voice
     * Bitmask: 0x0000000000400000 (bit 22)
     */
    VIDEO(22, "VIDEO", "Bật video"),
    
    /**
     * Mute members trong voice
     * Bitmask: 0x0000000000800000 (bit 23)
     */
    MUTE_MEMBERS(23, "MUTE_MEMBERS", "Mute thành viên"),
    
    /**
     * Deafen members trong voice
     * Bitmask: 0x0000000001000000 (bit 24)
     */
    DEAFEN_MEMBERS(24, "DEAFEN_MEMBERS", "Deafen thành viên"),
    
    /**
     * Di chuyển members giữa các voice channels
     * Bitmask: 0x0000000002000000 (bit 25)
     */
    MOVE_MEMBERS(25, "MOVE_MEMBERS", "Di chuyển thành viên"),
    
    /**
     * Sử dụng Voice Activity Detection (không cần push-to-talk)
     * Bitmask: 0x0000000004000000 (bit 26)
     */
    USE_VAD(26, "USE_VAD", "Dùng Voice Activity"),
    
    /**
     * Priority Speaker - Âm thanh to hơn khi nói
     * Bitmask: 0x0000000008000000 (bit 27)
     */
    PRIORITY_SPEAKER(27, "PRIORITY_SPEAKER", "Ưu tiên phát ngôn"),
    
    /**
     * Stream/Screenshare trong voice
     * Bitmask: 0x0000000010000000 (bit 28)
     */
    STREAM(28, "STREAM", "Stream/Chia sẻ màn hình"),
    
    // ===== ADVANCED PERMISSIONS (30-39) =====
    /**
     * Tạo instant invite cho kênh
     * Bitmask: 0x0000000040000000 (bit 30)
     */
    CREATE_INSTANT_INVITE(30, "CREATE_INSTANT_INVITE", "Tạo lời mời"),
    
    /**
     * Quản lý webhooks
     * Bitmask: 0x0000000080000000 (bit 31)
     */
    MANAGE_WEBHOOKS(31, "MANAGE_WEBHOOKS", "Quản lý webhooks"),
    
    /**
     * Quản lý threads (create, delete, archive)
     * Bitmask: 0x0000000100000000 (bit 32)
     */
    MANAGE_THREADS(32, "MANAGE_THREADS", "Quản lý threads"),
    
    /**
     * Tạo public threads
     * Bitmask: 0x0000000200000000 (bit 33)
     */
    CREATE_PUBLIC_THREADS(33, "CREATE_PUBLIC_THREADS", "Tạo public threads"),
    
    /**
     * Tạo private threads
     * Bitmask: 0x0000000400000000 (bit 34)
     */
    CREATE_PRIVATE_THREADS(34, "CREATE_PRIVATE_THREADS", "Tạo private threads"),
    
    /**
     * Sử dụng stickers từ server khác
     * Bitmask: 0x0000000800000000 (bit 35)
     */
    USE_EXTERNAL_STICKERS(35, "USE_EXTERNAL_STICKERS", "Dùng sticker ngoài"),
    
    /**
     * Sử dụng slash commands
     * Bitmask: 0x0000001000000000 (bit 36)
     */
    USE_APPLICATION_COMMANDS(36, "USE_APPLICATION_COMMANDS", "Dùng lệnh ứng dụng"),
    
    /**
     * Request to speak trong Stage channels
     * Bitmask: 0x0000002000000000 (bit 37)
     */
    REQUEST_TO_SPEAK(37, "REQUEST_TO_SPEAK", "Yêu cầu phát ngôn"),
    
    // ===== ADMINISTRATOR =====
    /**
     * Administrator - Bypass tất cả permissions
     * Bitmask: 0x0000000000000008 (bit 3)
     */
    ADMINISTRATOR(3, "ADMINISTRATOR", "Quản trị viên");
    
    private final int bitPosition;
    private final String name;
    private final String description;
    
    PermissionBit(int bitPosition, String name, String description) {
        this.bitPosition = bitPosition;
        this.name = name;
        this.description = description;
    }
    
    /**
     * Lấy giá trị bitmask của permission này
     * @return Long value với bit tương ứng được set
     */
    public long getValue() {
        return 1L << bitPosition;
    }
    
    public int getBitPosition() {
        return bitPosition;
    }
    
    public String getName() {
        return name;
    }
    
    public String getDescription() {
        return description;
    }
    
    /**
     * Kiểm tra xem bitmask có chứa permission này không
     * @param bitmask Bitmask cần kiểm tra
     * @return true nếu permission được set
     */
    public boolean isSet(long bitmask) {
        return (bitmask & getValue()) != 0;
    }
    
    /**
     * Tìm PermissionBit từ tên
     * @param name Tên permission (e.g., "SEND_MESSAGES")
     * @return PermissionBit hoặc null nếu không tìm thấy
     */
    public static PermissionBit fromName(String name) {
        for (PermissionBit bit : values()) {
            if (bit.name.equals(name)) {
                return bit;
            }
        }
        return null;
    }
    
    /**
     * Preset: All text permissions
     * @return Bitmask với tất cả text permissions
     */
    public static long getAllTextPermissions() {
        return VIEW_CHANNEL.getValue()
            | SEND_MESSAGES.getValue()
            | EMBED_LINKS.getValue()
            | ATTACH_FILES.getValue()
            | ADD_REACTIONS.getValue()
            | READ_MESSAGE_HISTORY.getValue()
            | MENTION_EVERYONE.getValue();
    }
    
    /**
     * Preset: All voice permissions
     * @return Bitmask với tất cả voice permissions
     */
    public static long getAllVoicePermissions() {
        return CONNECT.getValue()
            | SPEAK.getValue()
            | VIDEO.getValue()
            | STREAM.getValue()
            | USE_VAD.getValue();
    }
    
    /**
     * Preset: All permissions (cho Administrator)
     * @return Bitmask với tất cả permissions
     */
    public static long getAllPermissions() {
        long all = 0L;
        for (PermissionBit bit : values()) {
            all |= bit.getValue();
        }
        return all;
    }
}
