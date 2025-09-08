import { NextResponse } from 'next/server'

export async function GET(request) {
  return NextResponse.json({
    success: false,
    error: 'Database setup required',
    message: 'The crowdsourced_personas table needs to be created in Supabase dashboard',
    instructions: [
      '1. Go to Supabase dashboard',
      '2. Navigate to SQL Editor',
      '3. Run the migration file: supabase/migrations/20241208000000_add_crowdsourced_personas.sql',
      '4. Or create the table manually with the required schema'
    ],
    sql: `
CREATE TABLE crowdsourced_personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_ro VARCHAR(255),
  era VARCHAR(100),
  occupation VARCHAR(255),
  birth_year INTEGER,
  death_year INTEGER,
  context TEXT,
  personality_traits JSONB,
  linguistic_profile JSONB,
  debate_style JSONB,
  emotional_triggers JSONB,
  historical_context JSONB,
  quality_score DECIMAL(3,2) DEFAULT 0.0,
  is_approved BOOLEAN DEFAULT false,
  generation_prompt TEXT,
  ai_source VARCHAR(50),
  submitter_ip VARCHAR(45),
  usage_count INTEGER DEFAULT 0,
  positive_feedback INTEGER DEFAULT 0,
  negative_feedback INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

CREATE INDEX idx_crowdsourced_personas_name ON crowdsourced_personas(name);
CREATE INDEX idx_crowdsourced_personas_approved ON crowdsourced_personas(is_approved, quality_score DESC);
CREATE EXTENSION IF NOT EXISTS pg_trgm;
`
  })
}