import { NextResponse } from 'next/server'
import { voteOnDebate } from '../../lib/supabase.js'

export async function POST(request) {
  try {
    const { debateId, side } = await request.json()
    
    if (!debateId || !side) {
      return NextResponse.json(
        { error: 'debateId and side are required' },
        { status: 400 }
      )
    }
    
    if (!['pro', 'con', 'tie'].includes(side)) {
      return NextResponse.json(
        { error: 'side must be either "pro", "con", or "tie"' },
        { status: 400 }
      )
    }
    
    // Extract IP address from request headers
    const ip = request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              request.headers.get('cf-connecting-ip') ||
              'unknown'
    
    // Clean IP (take first one if multiple)
    const clientIp = ip.split(',')[0].trim()
    
    const result = await voteOnDebate(debateId, side, clientIp)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Voting error:', error)
    
    // Handle specific error cases
    if (error.message.includes('already voted')) {
      return NextResponse.json(
        { error: 'You have already voted on this debate' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    )
  }
}