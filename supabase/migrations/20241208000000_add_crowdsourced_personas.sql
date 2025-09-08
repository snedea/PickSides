-- Crowdsourced personas table for community-contributed historical figures
CREATE TABLE IF NOT EXISTS crowdsourced_personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_ro VARCHAR(255), -- Romanian name variant if different
  era VARCHAR(100), -- Historical era (e.g., "Ancient Greece", "Renaissance")
  occupation VARCHAR(255), -- Primary occupation/role
  birth_year INTEGER,
  death_year INTEGER,
  context TEXT, -- Optional user-provided context
  
  -- AI-generated personality profile
  personality_traits JSONB, -- Core personality traits and MBTI
  linguistic_profile JSONB, -- How they speak and communicate
  debate_style JSONB, -- How they argue and present ideas
  emotional_triggers JSONB, -- What triggers emotional responses
  historical_context JSONB, -- Key historical events and influences
  
  -- Quality and moderation
  quality_score DECIMAL(3,2) DEFAULT 0.0, -- AI-assessed quality (0.0-1.0)
  is_approved BOOLEAN DEFAULT false,
  generation_prompt TEXT, -- The prompt used for AI generation
  ai_source VARCHAR(50), -- Which AI model generated the profile
  
  -- Community metrics
  submitter_ip VARCHAR(45),
  usage_count INTEGER DEFAULT 0,
  positive_feedback INTEGER DEFAULT 0,
  negative_feedback INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

-- Indexes for performance and searching
CREATE INDEX IF NOT EXISTS idx_crowdsourced_personas_name ON crowdsourced_personas(name);
CREATE INDEX IF NOT EXISTS idx_crowdsourced_personas_approved ON crowdsourced_personas(is_approved, quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_crowdsourced_personas_usage ON crowdsourced_personas(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_crowdsourced_personas_era ON crowdsourced_personas(era);
CREATE INDEX IF NOT EXISTS idx_crowdsourced_personas_created ON crowdsourced_personas(created_at DESC);

-- Full-text search index for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_crowdsourced_personas_search 
ON crowdsourced_personas 
USING gin(to_tsvector('english', name || ' ' || COALESCE(occupation, '') || ' ' || COALESCE(era, '')));

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_persona_usage(p_persona_id UUID)
RETURNS void 
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE crowdsourced_personas 
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = p_persona_id;
END;
$$;

-- Function to check for potential duplicates using fuzzy matching
CREATE OR REPLACE FUNCTION find_similar_personas(
  p_name TEXT,
  p_era TEXT DEFAULT NULL,
  p_similarity_threshold DECIMAL DEFAULT 0.6
)
RETURNS TABLE(
  id UUID,
  name VARCHAR(255),
  era VARCHAR(100),
  similarity_score DECIMAL
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.name,
    cp.era,
    similarity(cp.name, p_name) as similarity_score
  FROM crowdsourced_personas cp
  WHERE 
    (similarity(cp.name, p_name) > p_similarity_threshold)
    OR (p_era IS NOT NULL AND cp.era = p_era AND similarity(cp.name, p_name) > 0.4)
  ORDER BY similarity_score DESC
  LIMIT 10;
END;
$$;

-- Enable the pg_trgm extension for similarity matching (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;