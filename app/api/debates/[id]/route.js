import { NextResponse } from 'next/server'
import { deleteDebate, getDebateById } from '../../../lib/supabase.js'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'en'
    
    if (!id) {
      return NextResponse.json(
        { error: 'Debate ID is required' },
        { status: 400 }
      )
    }
    
    const debate = await getDebateById(id)
    
    // Handle both old format (single topic) and new format (topic_en/topic_ro)
    // Intelligent topic fallback
    const requestedTopic = language === 'ro' ? debate.topic_ro : debate.topic_en
    const alternativeTopic = language === 'ro' ? debate.topic_en : debate.topic_ro
    const legacyTopic = debate.topic
    
    const topicInLanguage = requestedTopic || alternativeTopic || legacyTopic || 'Topic unavailable'
    
    // Handle both old rounds format and new bilingual format
    const rounds = Object.entries(debate.rounds).map(([roundNum, roundData]) => {
      const roundNumber = parseInt(roundNum)
      let type, pro, con, proTldr, conTldr
      
      // Check if this is the new bilingual format
      if (roundData.pro && typeof roundData.pro === 'object' && roundData.pro.en !== undefined) {
        // New bilingual format - intelligent fallback
        const requestedContent = {
          pro: roundData.pro[language],
          con: roundData.con[language], 
          proTldr: roundData.proTldr[language],
          conTldr: roundData.conTldr[language]
        }
        
        const alternativeContent = {
          pro: roundData.pro[language === 'en' ? 'ro' : 'en'],
          con: roundData.con[language === 'en' ? 'ro' : 'en'],
          proTldr: roundData.proTldr[language === 'en' ? 'ro' : 'en'],
          conTldr: roundData.conTldr[language === 'en' ? 'ro' : 'en']
        }
        
        // Check if requested language has content, fallback to alternative if empty
        const hasRequestedContent = requestedContent.pro && requestedContent.con
        const hasAlternativeContent = alternativeContent.pro && alternativeContent.con
        
        if (hasRequestedContent) {
          // Use requested language
          type = roundNumber === 1 ? (language === 'ro' ? 'Deschidere' : 'Opening') :
                 roundNumber === 2 ? (language === 'ro' ? 'Contraargument' : 'Counter') :
                 (language === 'ro' ? 'Închidere' : 'Closing')
          pro = requestedContent.pro
          con = requestedContent.con
          proTldr = requestedContent.proTldr
          conTldr = requestedContent.conTldr
        } else if (hasAlternativeContent) {
          // Fallback to alternative language
          const fallbackLang = language === 'en' ? 'ro' : 'en'
          type = roundNumber === 1 ? (fallbackLang === 'ro' ? 'Deschidere' : 'Opening') :
                 roundNumber === 2 ? (fallbackLang === 'ro' ? 'Contraargument' : 'Counter') :
                 (fallbackLang === 'ro' ? 'Închidere' : 'Closing')
          pro = alternativeContent.pro
          con = alternativeContent.con
          proTldr = alternativeContent.proTldr
          conTldr = alternativeContent.conTldr
        } else {
          // No content available in either language
          type = roundNumber === 1 ? 'Opening' : roundNumber === 2 ? 'Counter' : 'Closing'
          pro = 'Content not available'
          con = 'Content not available'
          proTldr = 'Unavailable'
          conTldr = 'Unavailable'
        }
      } else {
        // Old single-language format
        type = roundNumber === 1 ? 'Opening' : roundNumber === 2 ? 'Counter' : 'Closing'
        pro = roundData.pro
        con = roundData.con
        proTldr = roundData.proTldr
        conTldr = roundData.conTldr
      }
      
      return {
        round: roundNumber,
        type,
        pro,
        con,
        proTldr,
        conTldr
      }
    }).sort((a, b) => a.round - b.round)
    
    return NextResponse.json({
      id: debate.id,
      topic: topicInLanguage,
      pro_model: debate.pro_model,
      con_model: debate.con_model,
      pro_persona: debate.pro_persona,
      con_persona: debate.con_persona,
      pro_votes: debate.pro_votes,
      con_votes: debate.con_votes,
      tie_votes: debate.tie_votes,
      created_at: debate.created_at,
      rounds
    })
    
  } catch (error) {
    console.error('GET /api/debates/[id] error:', error)
    
    if (error.message === 'Debate not found') {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch debate' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    
    // Validate debate ID
    if (!id) {
      return NextResponse.json(
        { error: 'Debate ID is required' },
        { status: 400 }
      )
    }
    
    // Use the ID as-is (could be integer or UUID)
    const debateId = id
    
    // Delete the debate
    await deleteDebate(debateId)
    
    return NextResponse.json(
      { success: true, message: 'Debate deleted successfully' },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('DELETE /api/debates/[id] error:', error)
    
    // Handle specific error cases
    if (error.message === 'Debate not found') {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      )
    }
    
    // Generic server error
    return NextResponse.json(
      { error: 'Failed to delete debate' },
      { status: 500 }
    )
  }
}