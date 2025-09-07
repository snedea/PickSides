import { NextResponse } from 'next/server'
import { getRecentDebates } from '../../lib/supabase.js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const language = searchParams.get('language') || 'en'
    
    const debates = await getRecentDebates(limit)
    
    // Transform database format to frontend format
    
    const transformedDebates = debates.map(debate => {
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
      
      return {
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
      }
    })
    
    return NextResponse.json(transformedDebates)
    
  } catch (error) {
    console.error('Failed to fetch debates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debates' },
      { status: 500 }
    )
  }
}