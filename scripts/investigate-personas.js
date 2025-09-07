#!/usr/bin/env node

// Script to investigate persona data in the database
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function investigatePersonas() {
  console.log('🔍 Investigating persona data in debates table...\n')
  
  try {
    // Get all debates with relevant fields
    const { data: debates, error } = await supabase
      .from('debates')
      .select('id, topic, topic_en, topic_ro, pro_model, con_model, pro_persona, con_persona, created_at')
      .order('created_at', { ascending: true })
    
    if (error) {
      throw error
    }
    
    console.log(`Found ${debates.length} debates:\n`)
    
    debates.forEach((debate, index) => {
      const topic = debate.topic_en || debate.topic_ro || debate.topic || 'No topic'
      const shortTopic = topic.length > 50 ? topic.substring(0, 47) + '...' : topic
      
      console.log(`${index + 1}. "${shortTopic}"`)
      console.log(`   ID: ${debate.id}`)
      console.log(`   Pro Model: ${debate.pro_model || 'NULL'}`)
      console.log(`   Pro Persona: "${debate.pro_persona || 'NULL'}"`)
      console.log(`   Con Model: ${debate.con_model || 'NULL'}`)
      console.log(`   Con Persona: "${debate.con_persona || 'NULL'}"`)
      console.log(`   Created: ${debate.created_at}`)
      console.log('')
    })
    
    // Analysis
    console.log('📊 ANALYSIS:')
    const withPersonas = debates.filter(d => d.pro_persona && d.con_persona)
    const withoutPersonas = debates.filter(d => !d.pro_persona || !d.con_persona)
    
    console.log(`✅ Debates WITH persona data: ${withPersonas.length}`)
    console.log(`❌ Debates WITHOUT persona data: ${withoutPersonas.length}`)
    
    if (withoutPersonas.length > 0) {
      console.log('\n🚨 Debates missing persona data:')
      withoutPersonas.forEach(debate => {
        const topic = debate.topic_en || debate.topic_ro || debate.topic || 'No topic'
        const shortTopic = topic.length > 30 ? topic.substring(0, 27) + '...' : topic
        console.log(`   - "${shortTopic}" (ID: ${debate.id.substring(0, 8)}...)`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error investigating personas:', error)
  }
}

// Run the investigation
investigatePersonas()