-- Add persona fields to debates table
ALTER TABLE debates ADD COLUMN IF NOT EXISTS pro_persona VARCHAR(255);
ALTER TABLE debates ADD COLUMN IF NOT EXISTS con_persona VARCHAR(255);

-- Add indexes for persona fields for better query performance
CREATE INDEX IF NOT EXISTS idx_debates_pro_persona ON debates(pro_persona);
CREATE INDEX IF NOT EXISTS idx_debates_con_persona ON debates(con_persona);