import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request) {
  try {
    const { topic } = await request.json()

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required and must be a string' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const debateRounds = []

    // Round 1: Opening statements
    const opening = await generateDebateRound(openai, topic, 'opening', null)
    debateRounds.push({
      round: 1,
      type: 'Opening',
      pro: opening.pro,
      con: opening.con
    })

    // Round 2: Counter arguments
    const counter = await generateDebateRound(openai, topic, 'counter', opening)
    debateRounds.push({
      round: 2,
      type: 'Counter',
      pro: counter.pro,
      con: counter.con
    })

    // Round 3: Closing statements
    const closing = await generateDebateRound(openai, topic, 'closing', { opening, counter })
    debateRounds.push({
      round: 3,
      type: 'Closing',
      pro: closing.pro,
      con: closing.con
    })

    return NextResponse.json({
      topic,
      rounds: debateRounds,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Debate generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate debate' },
      { status: 500 }
    )
  }
}

async function generateDebateRound(openai, topic, roundType, previousRounds) {
  let proPrompt = ''
  let conPrompt = ''

  switch (roundType) {
    case 'opening':
      proPrompt = `You are arguing FOR the position: "${topic}". Write a compelling opening statement in exactly 75 words or less. Be persuasive, factual, and clear.`
      conPrompt = `You are arguing AGAINST the position: "${topic}". Write a compelling opening statement in exactly 75 words or less. Be persuasive, factual, and clear.`
      break
    
    case 'counter':
      proPrompt = `You are arguing FOR: "${topic}". The opposing side said: "${previousRounds.con}". Write a counter-argument in exactly 75 words or less that addresses their points while strengthening your position.`
      conPrompt = `You are arguing AGAINST: "${topic}". The opposing side said: "${previousRounds.pro}". Write a counter-argument in exactly 75 words or less that addresses their points while strengthening your position.`
      break
    
    case 'closing':
      proPrompt = `You are arguing FOR: "${topic}". Based on this debate history: Opening Pro: "${previousRounds.opening.pro}", Opening Con: "${previousRounds.opening.con}", Counter Pro: "${previousRounds.counter.pro}", Counter Con: "${previousRounds.counter.con}". Write a powerful closing statement in exactly 75 words or less.`
      conPrompt = `You are arguing AGAINST: "${topic}". Based on this debate history: Opening Pro: "${previousRounds.opening.pro}", Opening Con: "${previousRounds.opening.con}", Counter Pro: "${previousRounds.counter.pro}", Counter Con: "${previousRounds.counter.con}". Write a powerful closing statement in exactly 75 words or less.`
      break
  }

  const [proResponse, conResponse] = await Promise.all([
    openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: proPrompt }],
      max_tokens: 150,
      temperature: 0.8,
    }),
    openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: conPrompt }],
      max_tokens: 150,
      temperature: 0.8,
    })
  ])

  return {
    pro: proResponse.choices[0].message.content.trim(),
    con: conResponse.choices[0].message.content.trim()
  }
}