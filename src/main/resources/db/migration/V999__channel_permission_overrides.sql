-- =====================================================
-- MIGRATION: Channel Permission Overrides System
-- Discord-style permission system với bitmask
-- =====================================================

-- Bước 1: Backup bảng cũ (nếu cần)
-- CREATE TABLE channel_permissions_backup AS SELECT * FROM channel_permissions;

-- Bước 2: Drop bảng cũ (vì structure thay đổi hoàn toàn)
DROP TABLE IF EXISTS channel_permissions;

-- Bước 3: Tạo bảng mới với cấu trúc bitmask
CREATE TABLE channel_permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    channel_id BIGINT NOT NULL,
    target_type ENUM('USER', 'ROLE') NOT NULL COMMENT 'Loại target: USER hoặc ROLE',
    target_id BIGINT NOT NULL COMMENT 'ID của User hoặc Role (tùy target_type)',
    allow_bitmask BIGINT NOT NULL DEFAULT 0 COMMENT 'Bitmask permissions được ALLOW',
    deny_bitmask BIGINT NOT NULL DEFAULT 0 COMMENT 'Bitmask permissions bị DENY',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_channel_perm_channel FOREIGN KEY (channel_id) 
        REFERENCES channels(id) ON DELETE CASCADE,
    
    -- Unique constraint: Mỗi target chỉ có 1 permission override trong 1 channel
    CONSTRAINT uk_channel_target UNIQUE (channel_id, target_type, target_id),
    
    -- Indexes
    INDEX idx_channel_id (channel_id),
    INDEX idx_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Discord-style channel permission overrides với bitmask';

-- =====================================================
-- SEED DATA: Example Permission Overrides
-- =====================================================

-- Giả sử:
-- - Server ID = 1, Channel #general ID = 1
-- - Role @everyone ID = 1
-- - Role @member ID = 2
-- - User Alice ID = 100

-- Example 1: Deny SEND_MESSAGES cho @everyone trong #announcements (channel_id = 2)
-- SEND_MESSAGES = bit 10 = 1024 (0x400)
INSERT INTO channel_permissions (channel_id, target_type, target_id, allow_bitmask, deny_bitmask)
VALUES (2, 'ROLE', 1, 0, 1024);

-- Example 2: Allow SEND_MESSAGES cho Alice trong #announcements
-- Cho phép Alice gửi tin nhắn mặc dù @everyone bị deny
INSERT INTO channel_permissions (channel_id, target_type, target_id, allow_bitmask, deny_bitmask)
VALUES (2, 'USER', 100, 1024, 0);

-- Example 3: Private channel - Deny VIEW_CHANNEL cho @everyone
-- VIEW_CHANNEL = bit 0 = 1 (0x1)
INSERT INTO channel_permissions (channel_id, target_type, target_id, allow_bitmask, deny_bitmask)
VALUES (3, 'ROLE', 1, 0, 1);

-- Example 4: Private channel - Allow VIEW_CHANNEL + SEND_MESSAGES cho @member
-- VIEW_CHANNEL (1) | SEND_MESSAGES (1024) = 1025
INSERT INTO channel_permissions (channel_id, target_type, target_id, allow_bitmask, deny_bitmask)
VALUES (3, 'ROLE', 2, 1025, 0);

-- Example 5: Voice channel - Deny SPEAK cho user bị mute (user_id = 101)
-- SPEAK = bit 21 = 2097152 (0x200000)
INSERT INTO channel_permissions (channel_id, target_type, target_id, allow_bitmask, deny_bitmask)
VALUES (4, 'USER', 101, 0, 2097152);

-- =====================================================
-- HELPER: View để debug permissions (dạng human-readable)
-- =====================================================

CREATE OR REPLACE VIEW v_channel_permissions_readable AS
SELECT 
    cp.id,
    c.name AS channel_name,
    cp.target_type,
    CASE 
        WHEN cp.target_type = 'ROLE' THEN (SELECT name FROM roles WHERE id = cp.target_id)
        WHEN cp.target_type = 'USER' THEN (SELECT username FROM users WHERE id = cp.target_id)
    END AS target_name,
    cp.allow_bitmask,
    cp.deny_bitmask,
    -- Decode common permissions
    (cp.allow_bitmask & 1) > 0 AS allow_view_channel,
    (cp.allow_bitmask & 1024) > 0 AS allow_send_messages,
    (cp.allow_bitmask & 524288) > 0 AS allow_manage_messages,
    (cp.deny_bitmask & 1) > 0 AS deny_view_channel,
    (cp.deny_bitmask & 1024) > 0 AS deny_send_messages,
    (cp.deny_bitmask & 524288) > 0 AS deny_manage_messages,
    cp.created_at
FROM channel_permissions cp
JOIN channels c ON c.id = cp.channel_id;

-- =====================================================
-- QUERIES: Test permissions
-- =====================================================

-- Query 1: Xem tất cả permission overrides của channel #announcements (id=2)
SELECT * FROM v_channel_permissions_readable WHERE channel_name = 'announcements';

-- Query 2: Xem permission overrides của user Alice (id=100)
SELECT * FROM v_channel_permissions_readable 
WHERE target_type = 'USER' AND target_name = 'alice';

-- Query 3: Đếm số channels có permission overrides
SELECT COUNT(DISTINCT channel_id) AS channels_with_overrides
FROM channel_permissions;

-- Query 4: Top 10 users có nhiều permission overrides nhất
SELECT 
    cp.target_id AS user_id,
    u.username,
    COUNT(*) AS override_count
FROM channel_permissions cp
JOIN users u ON u.id = cp.target_id
WHERE cp.target_type = 'USER'
GROUP BY cp.target_id, u.username
ORDER BY override_count DESC
LIMIT 10;

-- =====================================================
-- MAINTENANCE: Cleanup orphaned permissions
-- =====================================================

-- Xóa permission overrides của roles đã bị xóa
DELETE cp FROM channel_permissions cp
WHERE cp.target_type = 'ROLE'
  AND NOT EXISTS (SELECT 1 FROM roles r WHERE r.id = cp.target_id);

-- Xóa permission overrides của users không còn trong server
DELETE cp FROM channel_permissions cp
WHERE cp.target_type = 'USER'
  AND NOT EXISTS (
      SELECT 1 FROM server_members sm
      JOIN channels c ON c.server_id = sm.server_id
      WHERE sm.user_id = cp.target_id AND c.id = cp.channel_id
  );

-- =====================================================
-- PERFORMANCE: Indexes recommendation
-- =====================================================

-- Nếu database lớn, consider thêm index:
-- CREATE INDEX idx_target_type_id ON channel_permissions(target_type, target_id);

-- =====================================================
-- BITMASK REFERENCE
-- =====================================================
-- Common permissions và bitmask values:
--
-- VIEW_CHANNEL          = 1         (bit 0,  0x1)
-- MANAGE_CHANNELS       = 2         (bit 1,  0x2)
-- ADMINISTRATOR         = 8         (bit 3,  0x8)
-- SEND_MESSAGES         = 1024      (bit 10, 0x400)
-- EMBED_LINKS           = 4096      (bit 12, 0x1000)
-- ATTACH_FILES          = 8192      (bit 13, 0x2000)
-- ADD_REACTIONS         = 16384     (bit 14, 0x4000)
-- MENTION_EVERYONE      = 65536     (bit 16, 0x10000)
-- READ_MESSAGE_HISTORY  = 131072    (bit 17, 0x20000)
-- MANAGE_MESSAGES       = 524288    (bit 19, 0x80000)
-- CONNECT               = 1048576   (bit 20, 0x100000)
-- SPEAK                 = 2097152   (bit 21, 0x200000)
-- VIDEO                 = 4194304   (bit 22, 0x400000)
-- MUTE_MEMBERS          = 8388608   (bit 23, 0x800000)
-- MOVE_MEMBERS          = 33554432  (bit 25, 0x2000000)
--
-- Để combine nhiều permissions:
-- allow_bitmask = SEND_MESSAGES | ATTACH_FILES = 1024 | 8192 = 9216
--
-- Để check permission trong SQL:
-- (allow_bitmask & 1024) > 0  -- Has SEND_MESSAGES?
