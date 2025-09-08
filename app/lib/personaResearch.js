/**
 * AI-Powered Historical Figure Research Service
 * 
 * This service uses AI to automatically research historical figures
 * and gather comprehensive biographical data from just their name.
 */

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null
const google = process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null

/**
 * Research a historical figure using AI to generate comprehensive biographical data
 * @param {string} name - Name of the historical figure
 * @returns {Object} Complete biographical research data
 */
export async function researchHistoricalFigure(name) {
  // Prefer Anthropic (Claude) for research as suggested by user
  const aiModel = anthropic ? 'claude' : openai ? 'gpt-4' : google ? 'gemini' : null
  
  if (!aiModel) {
    throw new Error('No AI model available for historical research')
  }

  try {
    console.log(`🔍 Researching historical figure: ${name} using ${aiModel}`)
    
    // Generate comprehensive biographical research
    const researchData = await generateBiographicalResearch(name, aiModel)
    
    // Validate and structure the response
    const structuredData = validateResearchData(researchData, name)
    
    console.log(`✅ Research complete for ${name}:`, {
      era: structuredData.era,
      occupation: structuredData.occupation,
      timespan: `${structuredData.birth_year || 'Unknown'}-${structuredData.death_year || 'Present'}`
    })
    
    return structuredData
    
  } catch (error) {
    console.error('Error researching historical figure:', error)
    throw new Error(`Failed to research ${name}: ${error.message}`)
  }
}

/**
 * Generate biographical research using specified AI model
 */
async function generateBiographicalResearch(name, aiModel) {
  const prompt = buildResearchPrompt(name)
  
  let response
  if (aiModel === 'claude' && anthropic) {
    response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: 0.2, // Lower temperature for factual accuracy
      messages: [{ role: 'user', content: prompt }]
    })
    return JSON.parse(response.content[0].text.trim())
    
  } else if (aiModel === 'gpt-4' && openai) {
    response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert historian and researcher who provides accurate, comprehensive biographical data in valid JSON format.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1500,
      temperature: 0.2
    })
    return JSON.parse(response.choices[0].message.content.trim())
    
  } else if (aiModel === 'gemini' && google) {
    const model = google.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 1500,
        temperature: 0.2
      }
    })
    return JSON.parse(result.response.text().trim())
  }
  
  throw new Error(`Unsupported AI model: ${aiModel}`)
}

/**
 * Build the research prompt for AI generation
 */
function buildResearchPrompt(name) {
  return `Research the historical figure "${name}" and provide comprehensive biographical data in the following JSON structure. Be historically accurate and provide specific details:

{
  "name": "${name}",
  "era": "specific historical period (e.g., Renaissance, Victorian Era, Ancient Greece, Modern Era)",
  "occupation": "primary role or occupation (e.g., Philosopher, Scientist, Artist, Political Leader)",
  "birth_year": year_as_number_or_null,
  "death_year": year_as_number_or_null,
  "context": "comprehensive biographical summary including key life events, major achievements, historical significance, philosophical views, notable works, and cultural impact (2-3 sentences)",
  "historical_accuracy": "confidence_score_0_to_1",
  "notable_quotes": ["famous quote 1", "famous quote 2", "famous quote 3"],
  "key_achievements": ["achievement 1", "achievement 2", "achievement 3"],
  "time_period_description": "description of the era they lived in",
  "cultural_context": "brief description of the cultural/social context of their time"
}

Requirements:
1. Provide accurate historical information - if uncertain about dates, use null
2. Era should be specific (not just "Ancient" but "Ancient Rome" or "Ancient Greece")
3. Occupation should be their most well-known role
4. Context should be rich and informative, highlighting what made them significant
5. Historical accuracy score should reflect confidence in the information (0.8+ for well-documented figures)
6. Include 2-3 famous quotes if available
7. If this person is not a historical figure or is fictional, set historical_accuracy to 0.0

Respond with ONLY the JSON object, no additional text.`
}

/**
 * Validate and structure the AI research response
 */
function validateResearchData(researchData, originalName) {
  // Ensure required fields exist
  const validated = {
    name: researchData.name || originalName,
    era: researchData.era || 'Unknown Era',
    occupation: researchData.occupation || 'Unknown Occupation',
    birth_year: validateYear(researchData.birth_year),
    death_year: validateYear(researchData.death_year),
    context: researchData.context || `Historical figure named ${originalName}`,
    historical_accuracy: Math.min(Math.max(researchData.historical_accuracy || 0.5, 0), 1),
    notable_quotes: Array.isArray(researchData.notable_quotes) ? researchData.notable_quotes.slice(0, 3) : [],
    key_achievements: Array.isArray(researchData.key_achievements) ? researchData.key_achievements.slice(0, 5) : [],
    time_period_description: researchData.time_period_description || '',
    cultural_context: researchData.cultural_context || ''
  }

  // Quality check - reject if accuracy is too low
  if (validated.historical_accuracy < 0.6) {
    throw new Error(`Insufficient historical information available for "${originalName}". They may be fictional, contemporary, or poorly documented.`)
  }

  return validated
}

/**
 * Validate year values
 */
function validateYear(year) {
  if (!year || typeof year !== 'number') return null
  
  // Reasonable historical range
  if (year < -3000 || year > new Date().getFullYear()) return null
  
  return Math.floor(year)
}

/**
 * Get research quality assessment
 */
export function assessResearchQuality(researchData) {
  let score = 0
  const maxScore = 10
  
  // Historical accuracy weight (40%)
  score += researchData.historical_accuracy * 4
  
  // Data completeness (30%)
  if (researchData.era && researchData.era !== 'Unknown Era') score += 1
  if (researchData.occupation && researchData.occupation !== 'Unknown Occupation') score += 1
  if (researchData.birth_year || researchData.death_year) score += 1
  
  // Rich context (20%)
  if (researchData.context && researchData.context.length > 100) score += 1
  if (researchData.notable_quotes && researchData.notable_quotes.length >= 2) score += 1
  
  // Additional context (10%)
  if (researchData.key_achievements && researchData.key_achievements.length >= 3) score += 0.5
  if (researchData.cultural_context && researchData.cultural_context.length > 50) score += 0.5
  
  return Math.min(score / maxScore, 1.0)
}