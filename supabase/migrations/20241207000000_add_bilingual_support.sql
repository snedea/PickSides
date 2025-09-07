-- Add bilingual support to debates table
-- This migration adds topic_en and topic_ro columns and modifies the rounds structure
-- to support nested language structure

-- Step 1: Add new topic columns
ALTER TABLE debates ADD COLUMN IF NOT EXISTS topic_en TEXT;
ALTER TABLE debates ADD COLUMN IF NOT EXISTS topic_ro TEXT;

-- Step 2: Create a temporary function to detect language of existing topics
CREATE OR REPLACE FUNCTION detect_topic_language(topic_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Simple Romanian language detection based on common Romanian words/patterns
  -- This is a basic heuristic - in production you might want more sophisticated detection
  IF topic_text ~* '(să|este|sunt|acest|această|trebuie|pentru|împotriva|români|românia|cu|de|la|în|pe|care|cel|cea|cei|cele|mai|foarte|doar|dacă|când|unde|cum|și|sau|dar|însă|totuși)' THEN
    RETURN 'ro';
  ELSE
    RETURN 'en';
  END IF;
END;
$$;

-- Step 3: Migrate existing topics to appropriate language columns
-- Detect language of existing topics and populate the new columns
UPDATE debates 
SET 
  topic_en = CASE 
    WHEN detect_topic_language(topic) = 'en' THEN topic 
    ELSE NULL 
  END,
  topic_ro = CASE 
    WHEN detect_topic_language(topic) = 'ro' THEN topic 
    ELSE NULL 
  END
WHERE topic IS NOT NULL;

-- Step 4: For debates that we couldn't properly detect, put them in English by default
UPDATE debates 
SET topic_en = topic 
WHERE topic_en IS NULL AND topic_ro IS NULL AND topic IS NOT NULL;

-- Step 5: Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_debates_topic_en ON debates(topic_en);
CREATE INDEX IF NOT EXISTS idx_debates_topic_ro ON debates(topic_ro);

-- Step 6: Make the old topic column nullable since we're using topic_en/topic_ro now
ALTER TABLE debates ALTER COLUMN topic DROP NOT NULL;

-- Step 7: Clean up the temporary function
DROP FUNCTION IF EXISTS detect_topic_language(TEXT);

-- Note: The rounds JSONB structure migration will be handled in the application code
-- since it requires more complex logic to properly restructure the nested data.
-- The new structure should be:
-- {
--   "1": {
--     "pro": {"en": "...", "ro": "..."},
--     "con": {"en": "...", "ro": "..."},
--     "proTldr": {"en": "...", "ro": "..."},
--     "conTldr": {"en": "...", "ro": "..."}
--   }
-- }