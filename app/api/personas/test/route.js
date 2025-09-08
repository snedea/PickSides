import { NextResponse } from 'next/server'
import { enrichPersona } from '../../../lib/personaEnrichment.js'

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, era, occupation, context } = body
    
    if (!name || !era || !occupation) {
      return NextResponse.json(
        { error: 'Name, era, and occupation are required' },
        { status: 400 }
      )
    }
    
    console.log(`🧪 Testing persona enrichment for: ${name}`)
    
    // Test the enrichment process
    const enrichedProfile = await enrichPersona({
      name: name.trim(),
      era: era.trim(),
      occupation: occupation.trim(),
      context: context?.trim() || ''
    })
    
    return NextResponse.json({
      success: true,
      name,
      qualityScore: enrichedProfile.quality_score,
      aiSource: enrichedProfile.ai_source,
      profile: {
        personality_traits: enrichedProfile.personality_traits,
        linguistic_profile: enrichedProfile.linguistic_profile,
        debate_style: enrichedProfile.debate_style,
        emotional_triggers: enrichedProfile.emotional_triggers,
        historical_context: enrichedProfile.historical_context
      }
    })
    
  } catch (error) {
    console.error('Persona enrichment test error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message
      },
      { status: 500 }
    )
  }
}