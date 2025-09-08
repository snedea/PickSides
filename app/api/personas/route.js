import { NextResponse } from 'next/server'
import { getApprovedPersonas, searchPersonas, getRecentPersonas } from '../../lib/crowdsourcedPersonas.js'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('search')
    const type = searchParams.get('type') || 'approved'
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let personas = []
    
    if (query && query.trim().length > 0) {
      // Search for personas matching the query
      personas = await searchPersonas(query.trim(), true)
    } else if (type === 'recent') {
      // Get recently added personas
      personas = await getRecentPersonas(limit)
    } else {
      // Get all approved personas
      personas = await getApprovedPersonas(limit)
    }
    
    // Format personas for frontend consumption
    const formattedPersonas = personas.map(persona => ({
      id: persona.id,
      name: persona.name,
      nameRo: persona.name_ro || persona.name,
      era: persona.era,
      occupation: persona.occupation,
      birth_year: persona.birth_year,
      death_year: persona.death_year,
      quality_score: persona.quality_score,
      usage_count: persona.usage_count,
      created_at: persona.created_at,
      icon: '🌟', // Community persona icon
      source: 'community'
    }))
    
    return NextResponse.json({
      success: true,
      personas: formattedPersonas,
      count: formattedPersonas.length
    })
    
  } catch (error) {
    console.error('Error fetching personas:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch personas',
        personas: [],
        count: 0
      },
      { status: 500 }
    )
  }
}