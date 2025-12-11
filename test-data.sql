-- CoCoCord Test Data for Chat Feature
-- Run this after application has created the schema

USE cococord_mysql;

-- Insert test server
INSERT INTO servers (id, name, description, icon_url, owner_id, is_public, created_at, updated_at)
VALUES (1, 'CoCoCord Community', 'Official CoCoCord server for testing', NULL, 1, true, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = name;

-- Insert categories
INSERT INTO categories (id, server_id, name, position, created_at, updated_at)
VALUES 
    (1, 1, 'Text Channels', 0, NOW(), NOW()),
    (2, 1, 'Voice Channels', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = name;

-- Insert text channels
INSERT INTO channels (id, server_id, category_id, name, type, topic, position, is_private, created_at, updated_at)
VALUES 
    (1, 1, 1, 'general', 'TEXT', 'Welcome to CoCoCord! Chat about anything here.', 0, false, NOW(), NOW()),
    (2, 1, 1, 'random', 'TEXT', 'Random discussions and fun stuff', 1, false, NOW(), NOW()),
    (3, 1, 2, 'General Voice', 'VOICE', 'General voice chat channel', 0, false, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = name;

-- Check if we have any users (you'll need to create users via registration first)
SELECT 'Please create users via registration first at http://localhost:8080/register' as Note;

-- After creating users, add them as server members
-- Replace USER_ID with actual user IDs from your registration

-- Example: Add first user as server owner
-- INSERT INTO server_members (server_id, user_id, joined_at, created_at, updated_at)
-- VALUES (1, 1, NOW(), NOW(), NOW());

-- You can check existing users with:
SELECT id, username, email, display_name FROM users;

-- Check channels created
SELECT c.id, c.name, c.type, c.topic, cat.name as category
FROM channels c
LEFT JOIN categories cat ON c.category_id = cat.id
WHERE c.server_id = 1
ORDER BY c.position;
