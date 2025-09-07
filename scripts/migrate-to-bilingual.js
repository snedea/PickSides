#!/usr/bin/env node

// Script to migrate existing debates to bilingual format
// This converts old single-language rounds to the new nested language structure

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Function to detect language of text using simple heuristics
function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'en'
  
  // Romanian language markers
  const romanianPatterns = [
    /\b(să|este|sunt|acest|această|trebuie|pentru|împotriva|români|românia|cu|de|la|în|pe|care|cel|cea|cei|cele|mai|foarte|doar|dacă|când|unde|cum|și|sau|dar|însă|totuși)\b/gi,
    /\b(argumentul|contra|problema|soluția|dezbatere|punct|important|național|european|românesc)\b/gi,
    /[ăâîșț]/g
  ]
  
  let romanianScore = 0
  romanianPatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) romanianScore += matches.length
  })
  
  // If we found significant Romanian markers, classify as Romanian
  return romanianScore > 2 ? 'ro' : 'en'
}

// Function to convert old rounds format to new bilingual format
function convertRoundsToRilingual(rounds, detectedLanguage) {
  const convertedRounds = {}
  
  Object.entries(rounds).forEach(([roundNum, roundData]) => {
    // Create new structure with detected language and placeholder for the other language
    convertedRounds[roundNum] = {
      pro: {
        [detectedLanguage]: roundData.pro || '',
        [detectedLanguage === 'en' ? 'ro' : 'en']: '' // Empty placeholder for missing language
      },
      con: {
        [detectedLanguage]: roundData.con || '',
        [detectedLanguage === 'en' ? 'ro' : 'en']: '' // Empty placeholder for missing language
      },
      proTldr: {
        [detectedLanguage]: roundData.proTldr || '',
        [detectedLanguage === 'en' ? 'ro' : 'en']: '' // Empty placeholder for missing language
      },
      conTldr: {
        [detectedLanguage]: roundData.conTldr || '',
        [detectedLanguage === 'en' ? 'ro' : 'en']: '' // Empty placeholder for missing language
      }
    }
  })
  
  return convertedRounds
}

async function migrateExistingDebates() {
  console.log('Starting migration of existing debates to bilingual format...')
  
  try {
    // First, get all debates that need migration
    const { data: debates, error: fetchError } = await supabase
      .from('debates')
      .select('*')
      .or('topic_en.is.null,topic_ro.is.null') // Find debates that haven't been migrated yet
    
    if (fetchError) {
      throw fetchError
    }
    
    console.log(`Found ${debates.length} debates to migrate`)
    
    if (debates.length === 0) {
      console.log('No debates need migration. All debates are already in bilingual format.')
      return
    }
    
    let successCount = 0
    let errorCount = 0
    
    for (const debate of debates) {
      try {
        console.log(`\nMigrating debate ${debate.id}...`)
        console.log(`Topic: "${debate.topic}"`)
        
        // Detect language of the topic and first round content
        const sampleText = `${debate.topic} ${debate.rounds['1']?.pro || ''} ${debate.rounds['1']?.con || ''}`
        const detectedLanguage = detectLanguage(sampleText)
        console.log(`Detected language: ${detectedLanguage}`)
        
        // Prepare update data
        const updateData = {}
        
        // Set topic in detected language and leave the other empty for now
        if (detectedLanguage === 'ro') {
          updateData.topic_ro = debate.topic
          updateData.topic_en = debate.topic_en || null
        } else {
          updateData.topic_en = debate.topic
          updateData.topic_ro = debate.topic_ro || null
        }
        
        // Check if rounds need migration (if they're not already in bilingual format)
        const firstRound = debate.rounds['1']
        const needsRoundsMigration = firstRound && 
          firstRound.pro && 
          typeof firstRound.pro === 'string' // Old format has strings, new format has objects
        
        if (needsRoundsMigration) {
          console.log('Converting rounds to bilingual format...')
          updateData.rounds = convertRoundsToRilingual(debate.rounds, detectedLanguage)
        } else {
          console.log('Rounds are already in bilingual format, keeping as-is')
        }
        
        // Update the debate
        const { error: updateError } = await supabase
          .from('debates')
          .update(updateData)
          .eq('id', debate.id)
        
        if (updateError) {
          throw updateError
        }
        
        console.log(`✅ Successfully migrated debate ${debate.id}`)
        successCount++
        
      } catch (error) {
        console.error(`❌ Failed to migrate debate ${debate.id}:`, error.message)
        errorCount++
      }
    }
    
    console.log(`\n📊 Migration completed:`)
    console.log(`✅ Successfully migrated: ${successCount} debates`)
    console.log(`❌ Failed to migrate: ${errorCount} debates`)
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some debates failed to migrate. Please check the errors above.')
      process.exit(1)
    } else {
      console.log('\n🎉 All debates successfully migrated to bilingual format!')
    }
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateExistingDebates()
}

module.exports = { migrateExistingDebates, detectLanguage, convertRoundsToRilingual }