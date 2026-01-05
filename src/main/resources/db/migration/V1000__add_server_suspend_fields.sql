-- Add suspend fields to servers table
ALTER TABLE servers ADD COLUMN is_suspended BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE servers ADD COLUMN suspend_reason VARCHAR(500);
ALTER TABLE servers ADD COLUMN suspended_at DATETIME;
ALTER TABLE servers ADD COLUMN suspended_until DATETIME;

-- Create index for suspended servers
CREATE INDEX idx_servers_is_suspended ON servers(is_suspended);
