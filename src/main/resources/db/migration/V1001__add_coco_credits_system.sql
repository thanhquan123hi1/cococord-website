-- CoCo Credits System
-- Virtual currency for CoCoCord platform

-- User Credits Table
CREATE TABLE IF NOT EXISTS coco_credits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_earned DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_spent DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Credit Transaction History
CREATE TABLE IF NOT EXISTS coco_credit_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type ENUM('EARN', 'SPEND', 'DEPOSIT', 'REFUND', 'ADMIN') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    description VARCHAR(500),
    reference_type VARCHAR(50),
    reference_id BIGINT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_created (user_id, created_at DESC)
);

-- Nitro Tiers
CREATE TABLE IF NOT EXISTS nitro_tiers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(1000),
    badge_url VARCHAR(500),
    banner_url VARCHAR(500),
    monthly_price DECIMAL(15,2) NOT NULL,
    yearly_price DECIMAL(15,2) NOT NULL,
    features TEXT,
    max_file_upload_mb INT NOT NULL DEFAULT 8,
    custom_emoji BOOLEAN NOT NULL DEFAULT FALSE,
    animated_avatar BOOLEAN NOT NULL DEFAULT FALSE,
    custom_banner BOOLEAN NOT NULL DEFAULT FALSE,
    hd_video_streaming BOOLEAN NOT NULL DEFAULT FALSE,
    server_boosts BOOLEAN NOT NULL DEFAULT FALSE,
    boost_count INT NOT NULL DEFAULT 0,
    profile_themes INT NOT NULL DEFAULT 0,
    exclusive_stickers BOOLEAN NOT NULL DEFAULT FALSE,
    discount_percent INT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User Nitro Subscriptions
CREATE TABLE IF NOT EXISTS user_nitro_subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    tier_id BIGINT NOT NULL,
    subscription_type ENUM('MONTHLY', 'YEARLY') NOT NULL DEFAULT 'MONTHLY',
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tier_id) REFERENCES nitro_tiers(id),
    INDEX idx_user_active (user_id, is_active)
);

-- Shop Items
CREATE TABLE IF NOT EXISTS shop_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    category ENUM('AVATAR_BORDER', 'MESSAGE_EFFECT', 'USER_FRAME', 'USER_PANEL_THEME', 
                  'USER_MENU_THEME', 'PROFILE_BADGE', 'CHAT_BUBBLE', 'NAME_COLOR', 
                  'NAME_EFFECT', 'STICKER_PACK', 'EMOJI_PACK') NOT NULL,
    rarity ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    price DECIMAL(15,2) NOT NULL,
    preview_url VARCHAR(500),
    asset_url VARCHAR(500),
    css_styles TEXT,
    animation_class VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_limited BOOLEAN NOT NULL DEFAULT FALSE,
    stock_limit INT,
    sold_count INT DEFAULT 0,
    available_from DATETIME,
    available_until DATETIME,
    required_nitro_tier_id BIGINT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (required_nitro_tier_id) REFERENCES nitro_tiers(id),
    INDEX idx_category_active (category, is_active)
);

-- User Purchased Items
CREATE TABLE IF NOT EXISTS user_shop_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    purchase_price DECIMAL(15,2) NOT NULL,
    is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
    purchased_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    equipped_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES shop_items(id),
    UNIQUE KEY uk_user_item (user_id, item_id),
    INDEX idx_user_equipped (user_id, is_equipped)
);

-- Missions
CREATE TABLE IF NOT EXISTS missions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    category ENUM('SOCIAL', 'CHAT', 'VOICE', 'SERVER', 'PROFILE', 'EXPLORATION', 'LOYALTY', 'SPECIAL') NOT NULL,
    type ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'ONE_TIME', 'REPEATABLE') NOT NULL DEFAULT 'DAILY',
    difficulty ENUM('EASY', 'MEDIUM', 'HARD', 'EXPERT') NOT NULL DEFAULT 'EASY',
    reward_credits DECIMAL(15,2) NOT NULL,
    required_count INT NOT NULL DEFAULT 1,
    action VARCHAR(50),
    target_id BIGINT,
    target_name VARCHAR(200),
    icon_url VARCHAR(500),
    icon_emoji VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    available_from DATETIME,
    available_until DATETIME,
    reset_schedule VARCHAR(20),
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type_active (type, is_active),
    INDEX idx_action_active (action, is_active)
);

-- User Mission Progress
CREATE TABLE IF NOT EXISTS user_missions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    mission_id BIGINT NOT NULL,
    period_key VARCHAR(20),
    current_progress INT NOT NULL DEFAULT 0,
    status ENUM('IN_PROGRESS', 'COMPLETED', 'CLAIMED') NOT NULL DEFAULT 'IN_PROGRESS',
    reward_claimed DECIMAL(15,2),
    completed_at DATETIME,
    reward_claimed_at DATETIME,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mission_id) REFERENCES missions(id),
    UNIQUE KEY uk_user_mission_period (user_id, mission_id, period_key),
    INDEX idx_user_status (user_id, status)
);

-- Insert default Nitro tiers
INSERT INTO nitro_tiers (code, name, description, monthly_price, yearly_price, features, max_file_upload_mb, custom_emoji, animated_avatar, custom_banner, hd_video_streaming, server_boosts, boost_count, profile_themes, exclusive_stickers, discount_percent, sort_order) VALUES
('BASIC', 'Nitro Basic', 'Nâng cấp trải nghiệm với các tính năng cơ bản', 50.00, 500.00, '["Custom emoji", "Bigger file uploads (50MB)", "HD video streaming"]', 50, TRUE, FALSE, FALSE, TRUE, FALSE, 0, 0, FALSE, 5, 1),
('PLUS', 'Nitro Plus', 'Nhiều hơn với avatar động và banner tùy chỉnh', 100.00, 1000.00, '["All Basic features", "Animated avatar", "Custom banner", "2 Server boosts", "More profile themes"]', 100, TRUE, TRUE, TRUE, TRUE, TRUE, 2, 3, FALSE, 10, 2),
('PRO', 'Nitro Pro', 'Trải nghiệm cao cấp với đầy đủ tính năng', 200.00, 2000.00, '["All Plus features", "500MB file uploads", "4 Server boosts", "Exclusive stickers", "Priority support"]', 500, TRUE, TRUE, TRUE, TRUE, TRUE, 4, 5, TRUE, 15, 3),
('PRO_PLUS', 'Nitro Pro+', 'Đẳng cấp vượt trội', 350.00, 3500.00, '["All Pro features", "Unlimited file uploads", "6 Server boosts", "All profile themes", "Early access features"]', 1024, TRUE, TRUE, TRUE, TRUE, TRUE, 6, 10, TRUE, 20, 4),
('PRO_PLUS_PLUS', 'Nitro Pro++', 'Đỉnh cao trải nghiệm CoCoCord', 500.00, 5000.00, '["All Pro+ features", "10 Server boosts", "Exclusive badge", "VIP support", "Beta features"]', 2048, TRUE, TRUE, TRUE, TRUE, TRUE, 10, 999, TRUE, 25, 5);

-- Insert default missions
INSERT INTO missions (title, description, category, type, difficulty, reward_credits, required_count, action, icon_emoji, sort_order) VALUES
-- Daily missions
('Đăng nhập hàng ngày', 'Đăng nhập vào CoCoCord', 'LOYALTY', 'DAILY', 'EASY', 10.00, 1, 'DAILY_LOGIN', '📅', 1),
('Gửi tin nhắn', 'Gửi 5 tin nhắn trong ngày', 'CHAT', 'DAILY', 'EASY', 15.00, 5, 'SEND_MESSAGE', '💬', 2),
('Phản ứng tin nhắn', 'React 3 tin nhắn', 'CHAT', 'DAILY', 'EASY', 10.00, 3, 'REACT_TO_MESSAGE', '😀', 3),
('Tham gia voice', 'Tham gia voice channel 1 lần', 'VOICE', 'DAILY', 'EASY', 20.00, 1, 'JOIN_VOICE_CHANNEL', '🎤', 4),

-- Weekly missions
('Trò chuyện sôi nổi', 'Gửi 50 tin nhắn trong tuần', 'CHAT', 'WEEKLY', 'MEDIUM', 100.00, 50, 'SEND_MESSAGE', '🔥', 10),
('Voice enthusiast', 'Tham gia voice 5 lần', 'VOICE', 'WEEKLY', 'MEDIUM', 75.00, 5, 'JOIN_VOICE_CHANNEL', '🎧', 11),
('Kết bạn mới', 'Thêm 1 người bạn mới', 'SOCIAL', 'WEEKLY', 'MEDIUM', 50.00, 1, 'ADD_FRIEND', '👋', 12),
('Khám phá server', 'Tham gia 1 server mới', 'SERVER', 'WEEKLY', 'EASY', 30.00, 1, 'JOIN_SERVER', '🌐', 13),

-- One-time missions
('Hoàn thiện profile', 'Cập nhật avatar, banner và bio', 'PROFILE', 'ONE_TIME', 'EASY', 100.00, 1, 'COMPLETE_PROFILE', '✨', 20),
('Tạo server đầu tiên', 'Tạo server của riêng bạn', 'SERVER', 'ONE_TIME', 'MEDIUM', 200.00, 1, 'CREATE_SERVER', '🏠', 21),
('Mời bạn bè', 'Mời người đầu tiên vào server', 'SOCIAL', 'ONE_TIME', 'MEDIUM', 150.00, 1, 'INVITE_MEMBER', '📨', 22);

-- Insert sample shop items
INSERT INTO shop_items (name, description, category, rarity, price, css_styles, animation_class, sort_order) VALUES
-- Avatar borders
('Viền Vàng', 'Viền avatar màu vàng sang trọng', 'AVATAR_BORDER', 'COMMON', 50.00, 'border: 3px solid gold; border-radius: 50%;', NULL, 1),
('Viền Cầu Vồng', 'Viền avatar gradient cầu vồng', 'AVATAR_BORDER', 'RARE', 150.00, 'border: 3px solid transparent; border-radius: 50%; background: linear-gradient(white, white) padding-box, linear-gradient(45deg, red, orange, yellow, green, blue, purple) border-box;', NULL, 2),
('Viền Lửa', 'Viền avatar với hiệu ứng lửa', 'AVATAR_BORDER', 'EPIC', 300.00, 'border: 3px solid #ff6b35; border-radius: 50%; box-shadow: 0 0 10px #ff6b35, 0 0 20px #ff6b35;', 'border-fire-anim', 3),
('Viền Huyền Thoại', 'Viền avatar hiệu ứng huyền bí', 'AVATAR_BORDER', 'LEGENDARY', 500.00, 'border: 4px solid #9b59b6; border-radius: 50%; box-shadow: 0 0 15px #9b59b6, 0 0 30px #8e44ad;', 'border-legendary-anim', 4),

-- Message effects
('Bong Bóng Chat', 'Tin nhắn có viền bong bóng', 'CHAT_BUBBLE', 'COMMON', 30.00, 'background: rgba(88, 101, 242, 0.2); border-radius: 18px; padding: 8px 12px;', NULL, 10),
('Gradient Message', 'Tin nhắn nền gradient', 'CHAT_BUBBLE', 'UNCOMMON', 80.00, 'background: linear-gradient(135deg, rgba(88, 101, 242, 0.3), rgba(87, 242, 135, 0.3)); border-radius: 12px; padding: 8px 12px;', NULL, 11),
('Neon Message', 'Tin nhắn phát sáng neon', 'MESSAGE_EFFECT', 'RARE', 200.00, 'text-shadow: 0 0 5px #fff, 0 0 10px #5865f2;', 'msg-neon-glow', 12),

-- Name colors
('Tên Xanh Dương', 'Màu tên xanh dương', 'NAME_COLOR', 'COMMON', 25.00, 'color: #3498db !important;', NULL, 20),
('Tên Hồng', 'Màu tên hồng', 'NAME_COLOR', 'COMMON', 25.00, 'color: #e91e63 !important;', NULL, 21),
('Tên Gradient', 'Tên với màu gradient', 'NAME_COLOR', 'RARE', 120.00, 'background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3); -webkit-background-clip: text; -webkit-text-fill-color: transparent;', NULL, 22),

-- Profile badges
('Badge Supporter', 'Huy hiệu supporter', 'PROFILE_BADGE', 'UNCOMMON', 100.00, NULL, NULL, 30),
('Badge OG', 'Huy hiệu người dùng đầu tiên', 'PROFILE_BADGE', 'LEGENDARY', 1000.00, NULL, NULL, 31);
