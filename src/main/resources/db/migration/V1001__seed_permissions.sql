-- Seed default permissions
INSERT INTO permissions (name, description, category) VALUES
-- GENERAL
('VIEW_CHANNEL', 'Xem kênh', 'GENERAL'),
('MANAGE_CHANNELS', 'Quản lý kênh', 'CHANNEL'),
('MANAGE_SERVER', 'Quản lý server', 'GENERAL'),
('VIEW_AUDIT_LOG', 'Xem lịch sử', 'GENERAL'),
('MANAGE_EMOJIS', 'Quản lý emoji', 'GENERAL'),

-- MEMBERSHIP
('CREATE_INVITE', 'Tạo lời mời', 'MEMBERSHIP'),
('CHANGE_NICKNAME', 'Đổi biệt danh', 'MEMBERSHIP'),
('MANAGE_NICKNAMES', 'Quản lý biệt danh', 'MEMBERSHIP'),
('KICK_MEMBERS', 'Kick thành viên', 'MEMBERSHIP'),
('BAN_MEMBERS', 'Cấm thành viên', 'MEMBERSHIP'),

-- MESSAGE
('SEND_MESSAGES', 'Gửi tin nhắn', 'MESSAGE'),
('EMBED_LINKS', 'Nhúng link', 'MESSAGE'),
('ATTACH_FILES', 'Đính kèm file', 'MESSAGE'),
('ADD_REACTIONS', 'Thêm reaction', 'MESSAGE'),
('USE_EMOJIS', 'Dùng emoji', 'MESSAGE'),
('MENTION_EVERYONE', 'Mention everyone', 'MESSAGE'),
('MANAGE_MESSAGES', 'Quản lý tin nhắn', 'MESSAGE'),
('READ_MESSAGE_HISTORY', 'Đọc lịch sử', 'MESSAGE'),

-- VOICE
('CONNECT', 'Kết nối voice', 'VOICE'),
('SPEAK', 'Nói trong voice', 'VOICE'),
('VIDEO', 'Bật video', 'VOICE'),
('MUTE_MEMBERS', 'Tắt tiếng thành viên', 'VOICE'),
('DEAFEN_MEMBERS', 'Điếc thành viên', 'VOICE'),
('MOVE_MEMBERS', 'Di chuyển thành viên', 'VOICE'),

-- ROLE
('MANAGE_ROLES', 'Quản lý vai trò', 'ROLE'),

-- ADMINISTRATOR
('ADMINISTRATOR', 'Quản trị viên - có tất cả quyền', 'GENERAL')

ON DUPLICATE KEY UPDATE description = VALUES(description);
