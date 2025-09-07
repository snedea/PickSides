import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { saveDebate } from '../../lib/supabase.js'

const MODEL_CONFIG = {
  'gpt-4-turbo': {
    provider: 'openai',
    model: 'gpt-4-turbo',
    apiKeyEnv: 'OPENAI_API_KEY'
  },
  'claude-3-sonnet': {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    apiKeyEnv: 'ANTHROPIC_API_KEY'
  },
  'gemini-pro': {
    provider: 'google',
    model: 'gemini-1.5-flash',
    apiKeyEnv: 'GOOGLE_API_KEY'
  }
}

const DEFAULT_MODEL = 'gpt-4-turbo'

export async function POST(request) {
  try {
    const { topic, proModel = DEFAULT_MODEL, conModel = DEFAULT_MODEL, proPersona = null, conPersona = null, language = 'en' } = await request.json()

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate models
    if (!MODEL_CONFIG[proModel] || !MODEL_CONFIG[conModel]) {
      return NextResponse.json(
        { error: 'Invalid model specified. Supported models: gpt-4-turbo, claude-3-sonnet, gemini-pro' },
        { status: 400 }
      )
    }

    // Check API keys
    const proModelConfig = MODEL_CONFIG[proModel]
    const conModelConfig = MODEL_CONFIG[conModel]

    if (!process.env[proModelConfig.apiKeyEnv]) {
      return NextResponse.json(
        { error: `API key for ${proModel} is not configured` },
        { status: 500 }
      )
    }

    if (!process.env[conModelConfig.apiKeyEnv]) {
      return NextResponse.json(
        { error: `API key for ${conModel} is not configured` },
        { status: 500 }
      )
    }

    // Initialize clients
    const clients = {
      openai: process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null,
      anthropic: process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null,
      google: process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null
    }

    const debateRounds = []

    // Round 1: Opening statements
    const opening = await generateDebateRound(clients, proModel, conModel, topic, 'opening', null, language, proPersona, conPersona)
    debateRounds.push({
      round: 1,
      type: language === 'ro' ? 'Deschidere' : 'Opening',
      pro: opening.pro,
      con: opening.con,
      proTldr: opening.proTldr,
      conTldr: opening.conTldr
    })

    // Round 2: Counter arguments
    const counter = await generateDebateRound(clients, proModel, conModel, topic, 'counter', opening, language, proPersona, conPersona)
    debateRounds.push({
      round: 2,
      type: language === 'ro' ? 'Contraargument' : 'Counter',
      pro: counter.pro,
      con: counter.con,
      proTldr: counter.proTldr,
      conTldr: counter.conTldr
    })

    // Round 3: Closing statements
    const closing = await generateDebateRound(clients, proModel, conModel, topic, 'closing', { opening, counter }, language, proPersona, conPersona)
    debateRounds.push({
      round: 3,
      type: language === 'ro' ? 'Închidere' : 'Closing',
      pro: closing.pro,
      con: closing.con,
      proTldr: closing.proTldr,
      conTldr: closing.conTldr
    })

    // Convert rounds array to the database format
    const roundsObj = {}
    debateRounds.forEach(round => {
      roundsObj[round.round] = {
        pro: round.pro,
        con: round.con,
        proTldr: round.proTldr,
        conTldr: round.conTldr
      }
    })

    // Save debate to database  
    const savedDebate = await saveDebate({
      topic,
      pro_model: proModel,
      con_model: conModel,
      pro_persona: proPersona,
      con_persona: conPersona,
      rounds: roundsObj
    })

    // Return saved debate in the expected format
    return NextResponse.json({
      ...savedDebate,
      rounds: debateRounds,
      generatedAt: savedDebate.created_at
    })

  } catch (error) {
    console.error('Debate generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate debate' },
      { status: 500 }
    )
  }
}

async function generateCompletion(client, model, prompt, language = 'en') {
  const modelConfig = MODEL_CONFIG[model]
  
  // System messages for Romanian language enforcement
  const systemMessage = language === 'ro' 
    ? 'You are a debate participant. You must respond ONLY in Romanian (limba română). Never use English or any other language, regardless of what language appears in the user message or context.'
    : 'You are a debate participant. Provide clear, factual arguments.'
  
  if (modelConfig.provider === 'openai') {
    const messages = language === 'ro' 
      ? [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ]
      : [{ role: "user", content: prompt }]
    
    const response = await client.openai.chat.completions.create({
      model: modelConfig.model,
      messages: messages,
      max_tokens: 150,
      temperature: 0.8,
    })
    return response.choices[0].message.content.trim()
  } else if (modelConfig.provider === 'anthropic') {
    const response = await client.anthropic.messages.create({
      model: modelConfig.model,
      max_tokens: 150,
      temperature: 0.8,
      system: language === 'ro' ? systemMessage : undefined,
      messages: [{ role: "user", content: prompt }]
    })
    return response.content[0].text.trim()
  } else if (modelConfig.provider === 'google') {
    const model = client.google.getGenerativeModel({ model: modelConfig.model })
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.8
      }
    })
    return result.response.text().trim()
  }
  
  throw new Error(`Unsupported model provider: ${modelConfig.provider}`)
}

async function generateTldrCompletion(client, model, prompt, language = 'en') {
  const modelConfig = MODEL_CONFIG[model]
  
  // System messages for Romanian language enforcement
  const systemMessage = language === 'ro' 
    ? 'You must respond ONLY in Romanian (limba română). Provide a very short summary in Romanian.'
    : 'Provide a short, clear summary.'
  
  if (modelConfig.provider === 'openai') {
    const messages = language === 'ro' 
      ? [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ]
      : [{ role: "user", content: prompt }]
    
    const response = await client.openai.chat.completions.create({
      model: modelConfig.model,
      messages: messages,
      max_tokens: 50,
      temperature: 0.7,
    })
    return response.choices[0].message.content.trim().replace(/^"|"$/g, '')
  } else if (modelConfig.provider === 'anthropic') {
    const response = await client.anthropic.messages.create({
      model: modelConfig.model,
      max_tokens: 50,
      temperature: 0.7,
      system: language === 'ro' ? systemMessage : undefined,
      messages: [{ role: "user", content: prompt }]
    })
    return response.content[0].text.trim().replace(/^"|"$/g, '')
  } else if (modelConfig.provider === 'google') {
    const model = client.google.getGenerativeModel({ model: modelConfig.model })
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 50,
        temperature: 0.7
      }
    })
    return result.response.text().trim().replace(/^"|"$/g, '')
  }
  
  throw new Error(`Unsupported model provider: ${modelConfig.provider}`)
}

async function generateDebateRound(clients, proModel, conModel, topic, roundType, previousRounds, language = 'en', proPersona = null, conPersona = null) {
  // Language-specific instructions
  const languageInstruction = language === 'ro' 
    ? 'IMPORTANT: You must respond ONLY in Romanian (limba română). Ignore any English text in the context and respond entirely in Romanian.\n\n' 
    : ''
  const languageReminder = language === 'ro'
    ? '\n\nREMEMBER: Your entire response must be in Romanian, regardless of the language used in quoted text.'
    : ''
  const wordLimit = language === 'ro' ? '75 de cuvinte sau mai puține' : '75 words or less'

  // Persona-specific instructions
  const proPersonaInstruction = proPersona && proPersona !== 'Default AI' && proPersona !== 'IA Implicită' 
    ? `You are ${proPersona}. Embody their personality, communication style, philosophical views, temperament, and mannerisms. Use their typical vocabulary and argument style. If they have famous quotes or positions, reference them naturally when relevant. ` 
    : ''
  const conPersonaInstruction = conPersona && conPersona !== 'Default AI' && conPersona !== 'IA Implicită' 
    ? `You are ${conPersona}. Embody their personality, communication style, philosophical views, temperament, and mannerisms. Use their typical vocabulary and argument style. If they have famous quotes or positions, reference them naturally when relevant. ` 
    : ''

  let proPrompt = ''
  let conPrompt = ''

  switch (roundType) {
    case 'opening':
      if (language === 'ro') {
        proPrompt = `${languageInstruction}${proPersonaInstruction}Argumentezi PENTRU poziția: "${topic}". Scrie o declarație de deschidere convingătoare în exact ${wordLimit}. Fii persuasiv, factual și clar.${languageReminder}`
        conPrompt = `${languageInstruction}${conPersonaInstruction}Argumentezi ÎMPOTRIVA poziției: "${topic}". Scrie o declarație de deschidere convingătoare în exact ${wordLimit}. Fii persuasiv, factual și clar.${languageReminder}`
      } else {
        proPrompt = `${proPersonaInstruction}You are arguing FOR the position: "${topic}". Write a compelling opening statement in exactly ${wordLimit}. Be persuasive, factual, and clear.`
        conPrompt = `${conPersonaInstruction}You are arguing AGAINST the position: "${topic}". Write a compelling opening statement in exactly ${wordLimit}. Be persuasive, factual, and clear.`
      }
      break
    
    case 'counter':
      if (language === 'ro') {
        proPrompt = `${languageInstruction}${proPersonaInstruction}Argumentezi PENTRU: "${topic}". Adversarul a spus: "${previousRounds.con}". Scrie un contraargument în exact ${wordLimit} care să răspundă punctelor lor și să-ți întărească poziția.${languageReminder}`
        conPrompt = `${languageInstruction}${conPersonaInstruction}Argumentezi ÎMPOTRIVA: "${topic}". Adversarul a spus: "${previousRounds.pro}". Scrie un contraargument în exact ${wordLimit} care să răspundă punctelor lor și să-ți întărească poziția.${languageReminder}`
      } else {
        proPrompt = `${proPersonaInstruction}You are arguing FOR: "${topic}". The opposing side said: "${previousRounds.con}". Write a counter-argument in exactly ${wordLimit} that addresses their points while strengthening your position.`
        conPrompt = `${conPersonaInstruction}You are arguing AGAINST: "${topic}". The opposing side said: "${previousRounds.pro}". Write a counter-argument in exactly ${wordLimit} that addresses their points while strengthening your position.`
      }
      break
    
    case 'closing':
      if (language === 'ro') {
        proPrompt = `${languageInstruction}${proPersonaInstruction}Argumentezi PENTRU: "${topic}". Bazat pe istoricul dezbaterii: Deschidere Pro: "${previousRounds.opening.pro}", Deschidere Con: "${previousRounds.opening.con}", Contraargument Pro: "${previousRounds.counter.pro}", Contraargument Con: "${previousRounds.counter.con}". Scrie o declarație finală puternică în exact ${wordLimit}.${languageReminder}`
        conPrompt = `${languageInstruction}${conPersonaInstruction}Argumentezi ÎMPOTRIVA: "${topic}". Bazat pe istoricul dezbaterii: Deschidere Pro: "${previousRounds.opening.pro}", Deschidere Con: "${previousRounds.opening.con}", Contraargument Pro: "${previousRounds.counter.pro}", Contraargument Con: "${previousRounds.counter.con}". Scrie o declarație finală puternică în exact ${wordLimit}.${languageReminder}`
      } else {
        proPrompt = `${proPersonaInstruction}You are arguing FOR: "${topic}". Based on this debate history: Opening Pro: "${previousRounds.opening.pro}", Opening Con: "${previousRounds.opening.con}", Counter Pro: "${previousRounds.counter.pro}", Counter Con: "${previousRounds.counter.con}". Write a powerful closing statement in exactly ${wordLimit}.`
        conPrompt = `${conPersonaInstruction}You are arguing AGAINST: "${topic}". Based on this debate history: Opening Pro: "${previousRounds.opening.pro}", Opening Con: "${previousRounds.opening.con}", Counter Pro: "${previousRounds.counter.pro}", Counter Con: "${previousRounds.counter.con}". Write a powerful closing statement in exactly ${wordLimit}.`
      }
      break
  }

  const [proArgument, conArgument] = await Promise.all([
    generateCompletion(clients, proModel, proPrompt, language),
    generateCompletion(clients, conModel, conPrompt, language)
  ])

  // Generate TL;DR summaries
  const tldrWordLimit = language === 'ro' ? '8 cuvinte sau mai puțin' : '8 words or less'
  const proTldrPrompt = language === 'ro' 
    ? `${languageInstruction}Rezumă acest argument Pro în ${tldrWordLimit}, captând punctul cheie: "${proArgument}"`
    : `Summarize this Pro argument in ${tldrWordLimit}, capturing the key point: "${proArgument}"`
  const conTldrPrompt = language === 'ro'
    ? `${languageInstruction}Rezumă acest argument Con în ${tldrWordLimit}, captând punctul cheie: "${conArgument}"`
    : `Summarize this Con argument in ${tldrWordLimit}, capturing the key point: "${conArgument}"`

  const [proTldr, conTldr] = await Promise.all([
    generateTldrCompletion(clients, proModel, proTldrPrompt, language),
    generateTldrCompletion(clients, conModel, conTldrPrompt, language)
  ])

  return {
    pro: proArgument,
    con: conArgument,
    proTldr,
    conTldr
  }
}