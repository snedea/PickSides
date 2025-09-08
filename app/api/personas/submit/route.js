import { NextResponse } from 'next/server'
import { submitPersona } from '../../../lib/crowdsourcedPersonas.js'

export async function POST(request) {
  try {
    const body = await request.json()
    const { name } = body
    
    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      )
    }
    
    // Get client IP for tracking
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '127.0.0.1'
    
    console.log(`📥 Persona submission received: ${name} from IP: ${ip}`)
    
    // Submit the persona for processing (research + enrichment)
    const result = await submitPersona({
      name: name.trim()
    }, ip)
    
    if (!result.success) {
      if (result.error === 'duplicate') {
        return NextResponse.json({
          success: false,
          error: 'duplicate',
          message: result.message,
          existingPersona: result.existingPersona
        }, { status: 409 })
      }
      
      if (result.error === 'quality') {
        return NextResponse.json({
          success: false,
          error: 'quality',
          message: result.message,
          qualityScore: result.qualityScore
        }, { status:422 })
      }
      
      return NextResponse.json({
        success: false,
        error: 'processing',
        message: result.message
      }, { status: 500 })
    }
    
    // Success response
    return NextResponse.json({
      success: true,
      persona: {
        id: result.persona.id,
        name: result.persona.name,
        era: result.persona.era,
        occupation: result.persona.occupation,
        qualityScore: result.qualityScore,
        autoApproved: result.autoApproved,
        created_at: result.persona.created_at
      },
      message: result.autoApproved 
        ? `"${name}" has been successfully added and is now available for debates!`
        : `"${name}" has been submitted for review and will be available once approved.`
    })
    
  } catch (error) {
    console.error('Persona submission error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'server',
        message: 'Internal server error occurred while processing the persona submission.' 
      },
      { status: 500 }
    )
  }
}