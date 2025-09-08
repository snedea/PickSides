import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getDebateById } from '../../../lib/supabase.js'
import { createClient } from '@supabase/supabase-js'

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request) {
  try {
    const { debateId, targetLanguage } = await request.json()

    if (!debateId || !targetLanguage) {
      return NextResponse.json(
        { error: 'debateId and targetLanguage are required' },
        { status: 400 }
      )
    }

    if (!['en', 'ro'].includes(targetLanguage)) {
      return NextResponse.json(
        { error: 'targetLanguage must be "en" or "ro"' },
        { status: 400 }
      )
    }

    // Get the debate data
    const debate = await getDebateById(debateId)
    if (!debate) {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      )
    }

    // Check if target language already exists for both rounds and topic
    const firstRound = debate.rounds['1']
    const topicExists = debate[`topic_${targetLanguage}`] && debate[`topic_${targetLanguage}`].trim()
    const roundsExist = firstRound?.pro?.[targetLanguage] && firstRound.pro[targetLanguage].trim()
    
    // Check for legacy bug where both topic_en and topic_ro have same content
    const sourceLanguage = targetLanguage === 'en' ? 'ro' : 'en'
    const sourceTopic = debate[`topic_${sourceLanguage}`] || debate.topic
    const targetTopic = debate[`topic_${targetLanguage}`]
    
    // Special case: if targetTopic exists but is identical to sourceTopic, it's a legacy bug
    // Also handle case where we have targetTopic but no sourceTopic (created in target language originally)
    const topicsAreIdentical = (targetTopic && sourceTopic && targetTopic === sourceTopic) ||
                             (targetTopic && !sourceTopic && targetLanguage !== 'en') // Romanian debate with no English topic
    
    
    // For legacy debates, we might have rounds but no topic translation - allow generation in this case
    // Also allow generation if topics are identical (legacy migration bug)
    // Special case: if topic exists but needs translation (identical content or wrong language)
    const needsTopicTranslation = !topicExists || topicsAreIdentical
    
    if (topicExists && roundsExist && !needsTopicTranslation) {
      return NextResponse.json(
        { message: 'Target language already exists', generated: false },
        { status: 200 }
      )
    }
    

    // Get source language content
    const hasSourceContent = firstRound?.pro?.[sourceLanguage] && firstRound.pro[sourceLanguage].trim()
    
    if (!hasSourceContent) {
      return NextResponse.json(
        { error: 'No source content found for generation' },
        { status: 400 }
      )
    }

    // Get source topic and prepare for translation (using already defined sourceTopic variable)
    let translatedTopic = debate[`topic_${targetLanguage}`]
    

    // Initialize AI clients
    const clients = {
      openai: process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null,
      anthropic: process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null,
      google: process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null
    }

    // Generate topic translation if needed
    // Force translation if topics are identical (legacy bug) or no proper translation exists
    const shouldTranslateTopic = needsTopicTranslation && 
                               ((sourceTopic && sourceTopic !== 'Unknown Topic') || 
                                (targetTopic && targetTopic !== 'Unknown Topic'))
    
    if (shouldTranslateTopic) {
      try {
        const topicToTranslate = sourceTopic || targetTopic
        translatedTopic = await generateTopicTranslation(clients.openai, topicToTranslate, targetLanguage)
      } catch (error) {
        console.error('Topic translation failed:', error)
        translatedTopic = sourceTopic || targetTopic // Fallback to available topic
      }
    }

    // Use translated topic or fallback
    const topic = translatedTopic || sourceTopic

    // Generate content for each round
    const generatedRounds = {}

    for (let roundNum = 1; roundNum <= 3; roundNum++) {
      const roundKey = roundNum.toString()
      const roundData = debate.rounds[roundKey]
      
      if (!roundData) continue

      // Get source content for this round
      const sourceProContent = roundData.pro?.[sourceLanguage]
      const sourceConContent = roundData.con?.[sourceLanguage]
      const sourceProTldr = roundData.proTldr?.[sourceLanguage]
      const sourceConTldr = roundData.conTldr?.[sourceLanguage]

      if (!sourceProContent || !sourceConContent) continue

      // Determine round type based on round number and target language
      let roundType
      if (roundNum === 1) {
        roundType = targetLanguage === 'ro' ? 'Deschidere' : 'Opening'
      } else if (roundNum === 2) {
        roundType = targetLanguage === 'ro' ? 'Contraargument' : 'Counter'
      } else {
        roundType = targetLanguage === 'ro' ? 'Închidere' : 'Closing'
      }

      // Generate new content for target language
      const generatedRound = await generateDebateRound(
        clients, 
        debate.pro_model, 
        debate.con_model, 
        topic, 
        roundType.toLowerCase().replace('contraargument', 'counter').replace('închidere', 'closing').replace('deschidere', 'opening'), 
        roundNum > 1 ? generatedRounds[`${roundNum - 1}`] : null,
        targetLanguage,
        debate.pro_persona,
        debate.con_persona
      )

      generatedRounds[roundKey] = {
        pro: { 
          ...roundData.pro,
          [targetLanguage]: generatedRound.pro 
        },
        con: { 
          ...roundData.con,
          [targetLanguage]: generatedRound.con 
        },
        proTldr: { 
          ...roundData.proTldr,
          [targetLanguage]: generatedRound.proTldr 
        },
        conTldr: { 
          ...roundData.conTldr,
          [targetLanguage]: generatedRound.conTldr 
        }
      }
    }

    // Update database with generated content
    const updatedRounds = { ...debate.rounds }
    Object.keys(generatedRounds).forEach(roundKey => {
      updatedRounds[roundKey] = generatedRounds[roundKey]
    })

    // Also update the topic in target language if translated
    const updateData = { rounds: updatedRounds }
    if (translatedTopic && translatedTopic !== sourceTopic) {
      updateData[`topic_${targetLanguage}`] = translatedTopic
    }

    const { error: updateError } = await supabase
      .from('debates')
      .update(updateData)
      .eq('id', debateId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      message: `Generated ${targetLanguage} content successfully`,
      generated: true,
      language: targetLanguage,
      debateId
    })

  } catch (error) {
    console.error('Language generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate language content', details: error.message },
      { status: 500 }
    )
  }
}

// Helper functions (copied from debate/route.js but with modifications)
async function generateCompletion(client, model, prompt, language = 'en') {
  const modelConfig = MODEL_CONFIG[model]
  
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
  const languageInstruction = language === 'ro' 
    ? 'IMPORTANT: You must respond ONLY in Romanian (limba română). Ignore any English text in the context and respond entirely in Romanian.\n\n' 
    : ''
  const languageReminder = language === 'ro'
    ? '\n\nREMEMBER: Your entire response must be in Romanian, regardless of the language used in quoted text.'
    : ''
  const wordLimit = language === 'ro' ? '75 de cuvinte sau mai puțin' : '75 words or less'

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
        proPrompt = `${languageInstruction}${proPersonaInstruction}Argumentezi PENTRU: "${topic}". Adversarul a spus: "${previousRounds?.con || ''}". Scrie un contraargument în exact ${wordLimit} care să răspundă punctelor lor și să-ți întărească poziția.${languageReminder}`
        conPrompt = `${languageInstruction}${conPersonaInstruction}Argumentezi ÎMPOTRIVA: "${topic}". Adversarul a spus: "${previousRounds?.pro || ''}". Scrie un contraargument în exact ${wordLimit} care să răspundă punctelor lor și să-ți întărească poziția.${languageReminder}`
      } else {
        proPrompt = `${proPersonaInstruction}You are arguing FOR: "${topic}". The opposing side said: "${previousRounds?.con || ''}". Write a counter-argument in exactly ${wordLimit} that addresses their points while strengthening your position.`
        conPrompt = `${conPersonaInstruction}You are arguing AGAINST: "${topic}". The opposing side said: "${previousRounds?.pro || ''}". Write a counter-argument in exactly ${wordLimit} that addresses their points while strengthening your position.`
      }
      break
    
    case 'closing':
      const prevRounds = previousRounds || {}
      if (language === 'ro') {
        proPrompt = `${languageInstruction}${proPersonaInstruction}Argumentezi PENTRU: "${topic}". Bazat pe istoricul dezbaterii anterior. Scrie o declarație finală puternică în exact ${wordLimit}.${languageReminder}`
        conPrompt = `${languageInstruction}${conPersonaInstruction}Argumentezi ÎMPOTRIVA: "${topic}". Bazat pe istoricul dezbaterii anterior. Scrie o declarație finală puternică în exact ${wordLimit}.${languageReminder}`
      } else {
        proPrompt = `${proPersonaInstruction}You are arguing FOR: "${topic}". Based on the previous debate rounds. Write a powerful closing statement in exactly ${wordLimit}.`
        conPrompt = `${conPersonaInstruction}You are arguing AGAINST: "${topic}". Based on the previous debate rounds. Write a powerful closing statement in exactly ${wordLimit}.`
      }
      break
  }

  const [proArgument, conArgument] = await Promise.all([
    generateCompletion(clients, proModel, proPrompt, language),
    generateCompletion(clients, conModel, conPrompt, language)
  ])

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

// Generate topic translation
async function generateTopicTranslation(client, sourceTopic, targetLanguage) {
  if (!client) {
    throw new Error('OpenAI client not available for topic translation')
  }

  const translationPrompt = targetLanguage === 'ro' 
    ? `Translate this debate topic to Romanian (limba română). Provide only the translated topic, nothing else: "${sourceTopic}"`
    : `Translate this debate topic to English. Provide only the translated topic, nothing else: "${sourceTopic}"`

  const systemMessage = targetLanguage === 'ro' 
    ? 'You are a professional translator. You must respond ONLY in Romanian (limba română). Provide only the translation, nothing else.'
    : 'You are a professional translator. Provide only the translation, nothing else.'

  const messages = [
    { role: "system", content: systemMessage },
    { role: "user", content: translationPrompt }
  ]

  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: messages,
    max_tokens: 100,
    temperature: 0.3, // Lower temperature for more consistent translations
  })

  return response.choices[0].message.content.trim().replace(/^"|"$/g, '')
}