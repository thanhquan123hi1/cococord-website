-- Fix schema mismatch: Remove legacy 'permission_id' column causing INSERT failures
-- This column is not present in the current ChannelPermission entity.
-- Error was: JpaSystemException: Field 'permission_id' doesn't have a default value

ALTER TABLE channel_permissions DROP COLUMN IF EXISTS permission_id;
