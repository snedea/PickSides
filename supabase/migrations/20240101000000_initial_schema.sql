-- Debates table for storing AI debates
CREATE TABLE IF NOT EXISTS debates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  pro_model VARCHAR(50) DEFAULT 'gpt-4-turbo',
  con_model VARCHAR(50) DEFAULT 'gpt-4-turbo',
  rounds JSONB NOT NULL,
  pro_votes INTEGER DEFAULT 0,
  con_votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table for tracking user votes
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  debate_id UUID REFERENCES debates(id) ON DELETE CASCADE,
  side VARCHAR(3) CHECK (side IN ('pro', 'con')),
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(debate_id, ip_address)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_debates_created ON debates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_debates_votes ON debates(pro_votes DESC, con_votes DESC);

-- Function for atomic vote updates
CREATE OR REPLACE FUNCTION increment_vote(
  p_debate_id UUID, 
  p_vote_side TEXT
)
RETURNS void 
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_vote_side = 'pro' THEN
    UPDATE debates 
    SET pro_votes = pro_votes + 1,
        updated_at = NOW()
    WHERE id = p_debate_id;
  ELSIF p_vote_side = 'con' THEN
    UPDATE debates 
    SET con_votes = con_votes + 1,
        updated_at = NOW()
    WHERE id = p_debate_id;
  END IF;
END;
$$;