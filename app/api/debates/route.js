import { NextResponse } from 'next/server'
import { getRecentDebates } from '../../lib/supabase.js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const debates = await getRecentDebates(limit)
    
    // Transform database format to frontend format
    const transformedDebates = debates.map(debate => ({
      id: debate.id,
      topic: debate.topic,
      pro_model: debate.pro_model,
      con_model: debate.con_model,
      pro_persona: debate.pro_persona,
      con_persona: debate.con_persona,
      pro_votes: debate.pro_votes,
      con_votes: debate.con_votes,
      tie_votes: debate.tie_votes,
      created_at: debate.created_at,
      rounds: Object.entries(debate.rounds).map(([roundNum, roundData]) => ({
        round: parseInt(roundNum),
        type: roundNum === '1' ? 'Opening' : roundNum === '2' ? 'Counter' : 'Closing',
        pro: roundData.pro,
        con: roundData.con,
        proTldr: roundData.proTldr,
        conTldr: roundData.conTldr
      })).sort((a, b) => a.round - b.round)
    }))
    
    return NextResponse.json(transformedDebates)
    
  } catch (error) {
    console.error('Failed to fetch debates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debates' },
      { status: 500 }
    )
  }
}