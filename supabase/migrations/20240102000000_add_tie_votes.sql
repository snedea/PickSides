-- Add tie_votes column to debates table
ALTER TABLE debates ADD COLUMN tie_votes INTEGER DEFAULT 0;

-- Update votes table constraint to allow 'tie' votes
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_side_check;
ALTER TABLE votes ADD CONSTRAINT votes_side_check CHECK (side IN ('pro', 'con', 'tie'));

-- Update increment_vote function to handle tie votes
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
  ELSIF p_vote_side = 'tie' THEN
    UPDATE debates 
    SET tie_votes = tie_votes + 1,
        updated_at = NOW()
    WHERE id = p_debate_id;
  END IF;
END;
$$;