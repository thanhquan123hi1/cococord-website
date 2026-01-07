-- Fix schema mismatch caused by stale V999 execution
-- The Java entity no longer uses 'is_allowed', so we must remove it to prevent INSERT errors.
-- Error was: JpaSystemException: Field 'is_allowed' doesn't have a default value

-- Option 1: Safe column drop (preferred to preserve existing data)
ALTER TABLE channel_permissions DROP COLUMN IF EXISTS is_allowed;

-- Also ensure bitmask columns exist with proper defaults
-- This handles case where only some columns were migrated
ALTER TABLE channel_permissions 
    MODIFY COLUMN allow_bitmask BIGINT NOT NULL DEFAULT 0,
    MODIFY COLUMN deny_bitmask BIGINT NOT NULL DEFAULT 0;

-- Option 2 (Alternative): If table is completely broken, uncomment to recreate
-- WARNING: This will DELETE ALL EXISTING PERMISSION DATA
/*
DROP TABLE IF EXISTS channel_permissions;
CREATE TABLE channel_permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    channel_id BIGINT NOT NULL,
    target_type ENUM('USER', 'ROLE') NOT NULL,
    target_id BIGINT NOT NULL,
    allow_bitmask BIGINT NOT NULL DEFAULT 0,
    deny_bitmask BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_channel_perm_channel FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    CONSTRAINT uk_channel_target UNIQUE (channel_id, target_type, target_id)
);
*/
