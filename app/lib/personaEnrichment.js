/**
 * AI Persona Enrichment Service
 * 
 * This service takes a basic persona submission and uses AI to generate
 * a comprehensive personality profile for use in debates.
 */

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { EMOTIONAL_STATES, PERSONA_EMOTIONAL_PROFILES } from './emotionalStates.js'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null
const google = process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null

/**
 * Generate comprehensive persona profile using AI
 * @param {Object} basicInfo - Basic persona information
 * @param {string} basicInfo.name - Persona name
 * @param {string} basicInfo.era - Historical era
 * @param {string} basicInfo.occupation - Primary occupation
 * @param {string} basicInfo.context - Optional context
 * @returns {Object} Complete persona profile
 */
export async function enrichPersona(basicInfo) {
  const { name, era, occupation, context = '' } = basicInfo
  
  // Choose the best available AI model
  const aiModel = openai ? 'gpt-4' : anthropic ? 'claude' : google ? 'gemini' : null
  if (!aiModel) {
    throw new Error('No AI model available for persona enrichment')
  }

  try {
    console.log(`🧠 Enriching persona: ${name} (${era}) using ${aiModel}`)
    
    // Generate the comprehensive profile
    const enrichedProfile = await generatePersonaProfile(name, era, occupation, context, aiModel)
    
    // Quality check the generated profile
    const qualityScore = assessProfileQuality(enrichedProfile)
    
    console.log(`✅ Persona enrichment complete. Quality score: ${qualityScore}`)
    
    return {
      ...enrichedProfile,
      quality_score: qualityScore,
      ai_source: aiModel,
      generation_timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('Error enriching persona:', error)
    throw new Error(`Failed to enrich persona ${name}: ${error.message}`)
  }
}

/**
 * Generate persona profile using specified AI model
 */
async function generatePersonaProfile(name, era, occupation, context, aiModel) {
  const prompt = buildEnrichmentPrompt(name, era, occupation, context)
  
  let response
  if (aiModel === 'gpt-4' && openai) {
    response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert historian and psychologist who creates detailed personality profiles of historical figures for AI debate systems. Provide comprehensive, accurate, and nuanced profiles in valid JSON format.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.3 // Lower temperature for factual accuracy
    })
    return JSON.parse(response.choices[0].message.content.trim())
    
  } else if (aiModel === 'claude' && anthropic) {
    response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    })
    return JSON.parse(response.content[0].text.trim())
    
  } else if (aiModel === 'gemini' && google) {
    const model = google.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.3
      }
    })
    return JSON.parse(result.response.text().trim())
  }
  
  throw new Error(`Unsupported AI model: ${aiModel}`)
}

/**
 * Build the enrichment prompt for AI generation
 */
function buildEnrichmentPrompt(name, era, occupation, context) {
  return `You are creating a comprehensive personality profile for "${name}" from ${era}, who was a ${occupation}.

${context ? `Additional context: ${context}` : ''}

Research this historical figure and generate a complete personality profile in the following JSON structure. Be historically accurate and psychologically nuanced:

{
  "personality_traits": {
    "core_traits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
    "mbti_type": "XXXX",
    "temperament": "primary_temperament",
    "key_motivations": ["motivation1", "motivation2", "motivation3"],
    "core_values": ["value1", "value2", "value3"],
    "communication_style": "description of how they communicate",
    "decision_making": "how they make decisions",
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2", "weakness3"]
  },
  
  "linguistic_profile": {
    "vocabulary_level": "sophisticated/moderate/simple",
    "sentence_structure": "complex/balanced/simple", 
    "favorite_phrases": ["phrase1", "phrase2", "phrase3"],
    "speaking_rhythm": "fast/moderate/slow",
    "formality_level": "very_formal/formal/casual/informal",
    "emotional_expression": "restrained/balanced/expressive/dramatic",
    "use_of_metaphors": "frequent/occasional/rare",
    "cultural_references": ["reference1", "reference2", "reference3"],
    "language_quirks": ["quirk1", "quirk2"]
  },
  
  "debate_style": {
    "argumentation_approach": "logical/emotional/mixed",
    "evidence_preference": "empirical/philosophical/anecdotal/historical",
    "response_to_opposition": "aggressive/assertive/diplomatic/defensive",
    "persuasion_tactics": ["tactic1", "tactic2", "tactic3"],
    "logical_frameworks": ["framework1", "framework2"],
    "rhetoric_style": "description of rhetorical approach",
    "handles_criticism": "description",
    "debate_intensity": "low/moderate/high/very_high"
  },
  
  "emotional_triggers": {
    "strong_positive": ["trigger1", "trigger2"],
    "moderate_positive": ["trigger1", "trigger2"],
    "neutral": ["topic1", "topic2"],
    "moderate_negative": ["trigger1", "trigger2"], 
    "strong_negative": ["trigger1", "trigger2"],
    "escalation_rate": 0.5,
    "cooldown_rate": 0.4,
    "max_intensity": 0.8,
    "base_temperament": "calm/curious/intense/dramatic/assertive/rebellious"
  },
  
  "historical_context": {
    "birth_year": year_or_null,
    "death_year": year_or_null,
    "key_life_events": ["event1", "event2", "event3"],
    "major_works_or_achievements": ["work1", "work2", "work3"],
    "historical_significance": "brief description",
    "contemporary_influences": ["influence1", "influence2"],
    "philosophical_school": "school_or_movement",
    "political_alignment": "description",
    "social_views": "brief description"
  }
}

Requirements:
1. All fields must be filled with historically accurate information
2. Be specific and detailed - avoid generic descriptions
3. Ensure psychological consistency across all sections
4. Use the exact JSON structure provided
5. For triggers, use specific topics/concepts, not just adjectives
6. Emotional parameters should be decimals between 0.0 and 1.0
7. Make it suitable for AI debate generation

Respond with ONLY the JSON object, no additional text.`
}

/**
 * Assess the quality of a generated persona profile
 * @param {Object} profile - Generated persona profile
 * @returns {number} Quality score between 0.0 and 1.0
 */
function assessProfileQuality(profile) {
  let score = 0
  const maxScore = 10
  
  console.log('🔍 Assessing profile quality:', {
    hasPersonalityTraits: !!profile.personality_traits,
    hasLinguisticProfile: !!profile.linguistic_profile,
    hasDebateStyle: !!profile.debate_style,
    hasEmotionalTriggers: !!profile.emotional_triggers,
    hasHistoricalContext: !!profile.historical_context
  })
  
  // Check completeness of required sections
  const requiredSections = [
    'personality_traits', 'linguistic_profile', 'debate_style', 
    'emotional_triggers', 'historical_context'
  ]
  
  for (const section of requiredSections) {
    if (profile[section] && typeof profile[section] === 'object') {
      score += 1.5
    }
  }
  
  // Check depth of personality traits
  if (profile.personality_traits?.core_traits?.length >= 5) score += 1
  if (profile.personality_traits?.mbti_type?.length === 4) score += 0.5
  if (profile.personality_traits?.key_motivations?.length >= 3) score += 0.5
  
  // Check linguistic profile completeness
  if (profile.linguistic_profile?.favorite_phrases?.length >= 3) score += 0.5
  if (profile.linguistic_profile?.vocabulary_level) score += 0.5
  
  // Check debate style specificity
  if (profile.debate_style?.persuasion_tactics?.length >= 3) score += 0.5
  if (profile.debate_style?.argumentation_approach) score += 0.5
  
  // Check emotional triggers specificity
  if (profile.emotional_triggers?.strong_negative?.length >= 2) score += 0.5
  if (profile.emotional_triggers?.strong_positive?.length >= 2) score += 0.5
  
  // Check historical context
  if (profile.historical_context?.key_life_events?.length >= 3) score += 0.5
  if (profile.historical_context?.major_works_or_achievements?.length >= 2) score += 0.5
  
  return Math.min(score / maxScore, 1.0)
}

/**
 * Convert enriched profile to emotional profile format
 * @param {Object} enrichedProfile - Complete persona profile
 * @param {string} personaName - Name of the persona
 * @returns {Object} Emotional profile for integration
 */
export function convertToEmotionalProfile(enrichedProfile, personaName) {
  const triggers = enrichedProfile.emotional_triggers
  
  return {
    baseTemperament: triggers.base_temperament || 'neutral',
    triggerSensitivity: {
      // Map specific triggers to emotional sensitivity scores
      'logical_fallacy': getGenericSensitivity(triggers, 'logic'),
      'personal_attack': getGenericSensitivity(triggers, 'personal'),
      'strong_evidence': getGenericSensitivity(triggers, 'evidence'),
      'weak_argument': getGenericSensitivity(triggers, 'weakness'),
      'circular_reasoning': getGenericSensitivity(triggers, 'reasoning'),
      'appeal_to_authority': getGenericSensitivity(triggers, 'authority'),
      
      // Add persona-specific triggers
      ...mapSpecificTriggers(triggers)
    },
    stateProgression: {
      escalationRate: triggers.escalation_rate || 0.5,
      cooldownRate: triggers.cooldown_rate || 0.5,
      maxIntensity: triggers.max_intensity || 0.8
    }
  }
}

/**
 * Get sensitivity for generic trigger types
 */
function getGenericSensitivity(triggers, category) {
  // Check if category appears in negative triggers (high sensitivity)
  const strongNegative = triggers.strong_negative?.some(t => 
    t.toLowerCase().includes(category)) ? 0.8 : 0
  const moderateNegative = triggers.moderate_negative?.some(t => 
    t.toLowerCase().includes(category)) ? 0.6 : 0
  const positive = triggers.strong_positive?.some(t => 
    t.toLowerCase().includes(category)) ? 0.7 : 0
  
  return Math.max(strongNegative, moderateNegative, positive) || 0.4
}

/**
 * Map specific persona triggers to sensitivity scores
 */
function mapSpecificTriggers(triggers) {
  const specificTriggers = {}
  
  // Map strong negative triggers to high sensitivity
  triggers.strong_negative?.forEach(trigger => {
    const key = trigger.toLowerCase().replace(/\s+/g, '_')
    specificTriggers[key] = 0.9
  })
  
  // Map moderate triggers
  triggers.moderate_negative?.forEach(trigger => {
    const key = trigger.toLowerCase().replace(/\s+/g, '_')
    specificTriggers[key] = 0.6
  })
  
  // Map positive triggers (things that engage them)
  triggers.strong_positive?.forEach(trigger => {
    const key = trigger.toLowerCase().replace(/\s+/g, '_')
    specificTriggers[key] = 0.8
  })
  
  return specificTriggers
}