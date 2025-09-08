/**
 * Emotional State Machine for AI Personas in PickSides
 * 
 * This system tracks and evolves each persona's emotional state throughout 
 * debates to make responses more dynamic and human-like.
 */

// Core emotional states for all personas
export const EMOTIONAL_STATES = {
  NEUTRAL: 'neutral',
  ENGAGED: 'engaged',
  FRUSTRATED: 'frustrated', 
  CONFIDENT: 'confident',
  DEFENSIVE: 'defensive',
  PASSIONATE: 'passionate'
}

// How states affect generation parameters and response style
export const STATE_MODIFIERS = {
  neutral: {
    temperature: 0.8,
    styleModifiers: [],
    responseLength: 'normal',
    promptAdditions: []
  },
  engaged: {
    temperature: 0.85,
    styleModifiers: ['more_examples', 'deeper_analysis', 'thoughtful_connections'],
    responseLength: 'extended',
    promptAdditions: [
      'Show genuine intellectual curiosity about this topic.',
      'Provide specific examples or analogies to illustrate your points.',
      'Build thoughtfully on the previous arguments.'
    ]
  },
  frustrated: {
    temperature: 0.9,
    styleModifiers: ['shorter_sentences', 'rhetorical_questions', 'mild_sarcasm'],
    responseLength: 'terse',
    promptAdditions: [
      'You are somewhat frustrated with the quality of the opposing argument.',
      'Use shorter, more direct sentences.',
      'Include a pointed rhetorical question or mild skepticism.',
      'Avoid being overly polite - be more direct.'
    ]
  },
  confident: {
    temperature: 0.75,
    styleModifiers: ['bold_claims', 'direct_refutation', 'authoritative_tone'],
    responseLength: 'normal',
    promptAdditions: [
      'You feel very confident about your position.',
      'Make bold, clear statements without hedging.',
      'Directly refute weak points in the opposing argument.',
      'Use an authoritative, assured tone.'
    ]
  },
  defensive: {
    temperature: 0.85,
    styleModifiers: ['hedging', 'clarifications', 'emphasis_on_misunderstanding'],
    responseLength: 'extended',
    promptAdditions: [
      'You feel the need to defend your position more carefully.',
      'Clarify any potential misunderstandings.',
      'Address counterarguments preemptively.',
      'Use qualifying language where appropriate.'
    ]
  },
  passionate: {
    temperature: 0.88,
    styleModifiers: ['personal_anecdotes', 'emphatic_language', 'moral_appeals'],
    responseLength: 'extended',
    promptAdditions: [
      'You feel deeply passionate about this issue.',
      'Use more emphatic, emotionally resonant language.',
      'Appeal to values and principles where relevant.',
      'Show the personal stakes or broader implications.'
    ]
  }
}

// Persona-specific emotional profiles
export const PERSONA_EMOTIONAL_PROFILES = {
  'Socrates': {
    baseTemperament: 'calm',
    triggerSensitivity: {
      'logical_fallacy': 0.8,     // Gets frustrated by bad logic
      'personal_attack': 0.2,     // Doesn't care much about insults
      'strong_evidence': 0.7,     // Gets engaged by good arguments
      'circular_reasoning': 0.9,  // Very frustrated by this
      'appeal_to_authority': 0.6, // Mildly frustrated
      'weak_argument': 0.5        // Becomes confident
    },
    stateProgression: {
      escalationRate: 0.3,  // Slow to get emotional
      cooldownRate: 0.5,    // Returns to neutral moderately
      maxIntensity: 0.7     // Never gets fully unhinged
    }
  },
  'Socrate': {  // Romanian name
    baseTemperament: 'calm',
    triggerSensitivity: {
      'logical_fallacy': 0.8,
      'personal_attack': 0.2,
      'strong_evidence': 0.7,
      'circular_reasoning': 0.9,
      'appeal_to_authority': 0.6,
      'weak_argument': 0.5
    },
    stateProgression: {
      escalationRate: 0.3,
      cooldownRate: 0.5,
      maxIntensity: 0.7
    }
  },
  'Albert Einstein': {
    baseTemperament: 'curious',
    triggerSensitivity: {
      'scientific_inaccuracy': 0.8,
      'anti_intellectualism': 0.9,
      'strong_evidence': 0.8,
      'creative_insight': 0.9,
      'dogmatism': 0.7,
      'weak_argument': 0.4
    },
    stateProgression: {
      escalationRate: 0.4,
      cooldownRate: 0.6,
      maxIntensity: 0.8
    }
  },
  'Shakespeare': {
    baseTemperament: 'dramatic',
    triggerSensitivity: {
      'personal_attack': 0.6,
      'artistic_critique': 0.7,
      'moral_complexity': 0.8,
      'strong_evidence': 0.6,
      'shallow_thinking': 0.8,
      'weak_argument': 0.7
    },
    stateProgression: {
      escalationRate: 0.6,
      cooldownRate: 0.4,
      maxIntensity: 0.9
    }
  },
  'Nietzsche': {
    baseTemperament: 'intense',
    triggerSensitivity: {
      'moral_absolutism': 0.9,
      'herd_mentality': 0.8,
      'weakness': 0.8,
      'strong_evidence': 0.7,
      'personal_attack': 0.7,
      'conventional_wisdom': 0.8
    },
    stateProgression: {
      escalationRate: 0.8,
      cooldownRate: 0.3,
      maxIntensity: 1.0
    }
  },
  'Ayn Rand': {
    baseTemperament: 'assertive',
    triggerSensitivity: {
      'collectivism': 0.9,
      'altruism': 0.8,
      'government_intervention': 0.8,
      'strong_evidence': 0.6,
      'personal_attack': 0.7,
      'weak_argument': 0.6
    },
    stateProgression: {
      escalationRate: 0.7,
      cooldownRate: 0.4,
      maxIntensity: 0.9
    }
  },
  'Tristan Tzara': {
    baseTemperament: 'rebellious',
    triggerSensitivity: {
      'traditionalism': 0.8,
      'rationalism': 0.7,
      'bourgeois_values': 0.9,
      'strong_evidence': 0.5,
      'personal_attack': 0.6,
      'conventional_logic': 0.8
    },
    stateProgression: {
      escalationRate: 0.7,
      cooldownRate: 0.3,
      maxIntensity: 0.9
    }
  },
  'Default AI': {
    baseTemperament: 'neutral',
    triggerSensitivity: {
      'logical_fallacy': 0.5,
      'personal_attack': 0.3,
      'strong_evidence': 0.6,
      'weak_argument': 0.4
    },
    stateProgression: {
      escalationRate: 0.4,
      cooldownRate: 0.6,
      maxIntensity: 0.6
    }
  },
  'IA Implicită': {  // Romanian Default AI
    baseTemperament: 'neutral',
    triggerSensitivity: {
      'logical_fallacy': 0.5,
      'personal_attack': 0.3,
      'strong_evidence': 0.6,
      'weak_argument': 0.4
    },
    stateProgression: {
      escalationRate: 0.4,
      cooldownRate: 0.6,
      maxIntensity: 0.6
    }
  }
}

/**
 * Analyze opponent's argument to determine emotional impact
 * @param {string} opponentText - The opponent's argument text
 * @param {string} currentState - Current emotional state
 * @param {string} personaName - Name of the persona
 * @param {number} round - Current debate round (1, 2, or 3)
 * @returns {Object} Analysis with recommended state and reasoning
 */
export function analyzeArgumentImpact(opponentText, currentState, personaName, round = 1) {
  const profile = PERSONA_EMOTIONAL_PROFILES[personaName] || PERSONA_EMOTIONAL_PROFILES['Default AI']
  
  if (!opponentText || typeof opponentText !== 'string') {
    return {
      newState: EMOTIONAL_STATES.NEUTRAL,
      confidence: 1.0,
      triggers: [],
      reasoning: 'No opponent text to analyze'
    }
  }
  
  const text = opponentText.toLowerCase()
  const triggers = []
  let maxTriggerStrength = 0
  let dominantTrigger = null
  
  // Detect various argument patterns and triggers
  const triggerPatterns = {
    logical_fallacy: [
      'strawman', 'ad hominem', 'false dichotomy', 'slippery slope',
      'circular logic', 'therefore', 'proves that', 'obviously',
      'everyone knows', 'common sense', 'appeal to emotion'
    ],
    personal_attack: [
      'you are wrong', 'you don\'t understand', 'ignorant', 'stupid',
      'foolish', 'naive', 'clearly you', 'obviously you don\'t'
    ],
    strong_evidence: [
      'research shows', 'studies indicate', 'data suggests', 'evidence demonstrates',
      'according to', 'statistics show', 'peer reviewed', 'empirical'
    ],
    circular_reasoning: [
      'because it is', 'by definition', 'it\'s true because', 'we know because'
    ],
    appeal_to_authority: [
      'experts say', 'authorities agree', 'scientists believe', 'studies show',
      'research proves', 'according to experts'
    ],
    weak_argument: [
      'i think', 'maybe', 'possibly', 'could be', 'might be',
      'perhaps', 'i believe', 'in my opinion', 'seems like'
    ],
    scientific_inaccuracy: [
      'theory is just', 'evolution is just a theory', 'climate change is fake',
      'vaccines cause', 'natural immunity', 'chemicals are bad'
    ],
    anti_intellectualism: [
      'too much thinking', 'overthinking', 'academic nonsense', 'ivory tower',
      'common sense is better', 'real world experience'
    ],
    creative_insight: [
      'imagine if', 'what if we', 'another way to think', 'creative solution',
      'innovative approach', 'fresh perspective'
    ],
    dogmatism: [
      'absolutely must', 'never acceptable', 'always wrong', 'period',
      'end of discussion', 'no exceptions'
    ],
    artistic_critique: [
      'art is', 'beauty is', 'aesthetic', 'creative expression',
      'artistic merit', 'cultural value'
    ],
    moral_complexity: [
      'right and wrong', 'ethical dilemma', 'moral question', 'virtue',
      'justice', 'good and evil', 'moral responsibility'
    ],
    shallow_thinking: [
      'simple answer', 'black and white', 'easy solution', 'obvious choice',
      'common sense', 'just do it'
    ],
    moral_absolutism: [
      'always wrong', 'never right', 'absolute truth', 'universal law',
      'moral imperative', 'categorically'
    ],
    herd_mentality: [
      'everyone believes', 'society expects', 'normal people', 'most people',
      'conventional wisdom', 'traditional values'
    ],
    weakness: [
      'give up', 'can\'t handle', 'too difficult', 'impossible',
      'helpless', 'victim', 'need help'
    ],
    conventional_wisdom: [
      'traditional approach', 'way things are done', 'established practice',
      'conventional method', 'standard procedure'
    ],
    collectivism: [
      'for the greater good', 'society needs', 'collective responsibility',
      'community over individual', 'sacrifice for others'
    ],
    altruism: [
      'selfless act', 'helping others', 'sacrifice yourself', 'put others first',
      'altruistic', 'for the benefit of others'
    ],
    government_intervention: [
      'government should', 'regulation is needed', 'state control',
      'public sector', 'government program', 'federal oversight'
    ],
    traditionalism: [
      'traditional values', 'way things were', 'old ways', 'established order',
      'conventional approach', 'time tested'
    ],
    rationalism: [
      'logical approach', 'rational thinking', 'reasoned argument',
      'systematic analysis', 'objective truth'
    ],
    bourgeois_values: [
      'middle class', 'property rights', 'material success',
      'conventional success', 'respectability', 'social status'
    ],
    conventional_logic: [
      'logical progression', 'reasonable conclusion', 'rational argument',
      'systematic approach', 'methodical thinking'
    ]
  }
  
  // Check each trigger pattern
  for (const [triggerType, patterns] of Object.entries(triggerPatterns)) {
    let triggerCount = 0
    const foundPatterns = []
    
    for (const pattern of patterns) {
      if (text.includes(pattern)) {
        triggerCount++
        foundPatterns.push(pattern)
      }
    }
    
    if (triggerCount > 0) {
      const sensitivity = profile.triggerSensitivity[triggerType] || 0.3
      const strength = (triggerCount / patterns.length) * sensitivity
      
      triggers.push({
        type: triggerType,
        strength,
        patterns: foundPatterns,
        sensitivity
      })
      
      if (strength > maxTriggerStrength) {
        maxTriggerStrength = strength
        dominantTrigger = triggerType
      }
    }
  }
  
  // Determine new emotional state based on triggers
  let newState = currentState
  const escalationRate = profile.stateProgression.escalationRate
  const maxIntensity = profile.stateProgression.maxIntensity
  
  if (dominantTrigger && maxTriggerStrength > 0.3) {
    // Apply escalation based on personality and round
    const roundMultiplier = round > 1 ? 1 + (round - 1) * 0.2 : 1
    const effectiveStrength = Math.min(maxTriggerStrength * escalationRate * roundMultiplier, maxIntensity)
    
    // Map triggers to emotional states
    switch (dominantTrigger) {
      case 'logical_fallacy':
      case 'circular_reasoning':
      case 'anti_intellectualism':
      case 'shallow_thinking':
        newState = effectiveStrength > 0.6 ? EMOTIONAL_STATES.FRUSTRATED : EMOTIONAL_STATES.ENGAGED
        break
        
      case 'personal_attack':
        newState = effectiveStrength > 0.7 ? EMOTIONAL_STATES.PASSIONATE : EMOTIONAL_STATES.DEFENSIVE
        break
        
      case 'strong_evidence':
      case 'creative_insight':
        newState = EMOTIONAL_STATES.ENGAGED
        break
        
      case 'weak_argument':
        newState = EMOTIONAL_STATES.CONFIDENT
        break
        
      case 'appeal_to_authority':
      case 'dogmatism':
        newState = effectiveStrength > 0.5 ? EMOTIONAL_STATES.FRUSTRATED : EMOTIONAL_STATES.ENGAGED
        break
        
      case 'moral_absolutism':
      case 'herd_mentality':
      case 'collectivism':
      case 'traditionalism':
        // These trigger Nietzsche and similar personas strongly
        newState = effectiveStrength > 0.6 ? EMOTIONAL_STATES.PASSIONATE : EMOTIONAL_STATES.FRUSTRATED
        break
        
      case 'artistic_critique':
      case 'moral_complexity':
        newState = EMOTIONAL_STATES.ENGAGED
        break
        
      default:
        newState = effectiveStrength > 0.5 ? EMOTIONAL_STATES.ENGAGED : EMOTIONAL_STATES.NEUTRAL
    }
  } else if (triggers.length === 0) {
    // No triggers found, apply cooldown
    const cooldownRate = profile.stateProgression.cooldownRate
    if (currentState !== EMOTIONAL_STATES.NEUTRAL && Math.random() < cooldownRate) {
      newState = EMOTIONAL_STATES.NEUTRAL
    }
  }
  
  return {
    newState,
    confidence: Math.min(maxTriggerStrength, 1.0),
    triggers: triggers.sort((a, b) => b.strength - a.strength),
    reasoning: triggers.length > 0 
      ? `Detected ${dominantTrigger} (strength: ${maxTriggerStrength.toFixed(2)}) → ${newState}`
      : `No significant triggers detected, maintaining ${currentState}`
  }
}

/**
 * Apply emotional state to enhance prompt generation
 * @param {string} basePrompt - Original prompt text
 * @param {string} emotionalState - Current emotional state
 * @param {string} personaName - Name of the persona
 * @param {number} round - Current round number
 * @param {string} language - Language for the debate ('en' or 'ro')
 * @returns {Object} Enhanced prompt and generation parameters
 */
export function applyEmotionalState(basePrompt, emotionalState, personaName, round, language = 'en') {
  const stateConfig = STATE_MODIFIERS[emotionalState] || STATE_MODIFIERS.neutral
  const profile = PERSONA_EMOTIONAL_PROFILES[personaName] || PERSONA_EMOTIONAL_PROFILES['Default AI']
  
  // Language-specific emotional instructions
  const emotionalInstructions = language === 'ro' ? {
    engaged: [
      'Arată curiozitate intelectuală genuină despre acest subiect.',
      'Oferă exemple specifice sau analogii pentru a-ți ilustra punctele.',
      'Construiește în mod gânditor asupra argumentelor precedente.'
    ],
    frustrated: [
      'Ești oarecum frustrat de calitatea argumentului opus.',
      'Folosește propoziții mai scurte și mai directe.',
      'Include o întrebare retorică sau un scepticism ușor.',
      'Evită să fii prea politicos - fii mai direct.'
    ],
    confident: [
      'Te simți foarte încrezător în poziția ta.',
      'Fă declarații îndrăznețe și clare fără ezitare.',
      'Refută direct punctele slabe din argumentul opus.',
      'Folosește un ton autoritar și sigur.'
    ],
    defensive: [
      'Simți nevoia să-ți aperi poziția mai atent.',
      'Clarifică orice neînțelegeri potențiale.',
      'Abordează contraargumentele în mod preventiv.',
      'Folosește limbaj calificat acolo unde este cazul.'
    ],
    passionate: [
      'Te simți profund pasionat de această problemă.',
      'Folosește un limbaj mai emfatic și rezonant emoțional.',
      'Fă apel la valori și principii acolo unde este relevant.',
      'Arată miza personală sau implicațiile mai largi.'
    ]
  } : {
    engaged: stateConfig.promptAdditions,
    frustrated: stateConfig.promptAdditions,
    confident: stateConfig.promptAdditions,
    defensive: stateConfig.promptAdditions,
    passionate: stateConfig.promptAdditions
  }
  
  const stateInstructions = emotionalInstructions[emotionalState] || []
  
  // Build enhanced prompt
  const emotionalContext = stateInstructions.length > 0 
    ? `\n\nEMOTIONAL CONTEXT: ${stateInstructions.join(' ')}\n`
    : ''
    
  const enhancedPrompt = basePrompt + emotionalContext
  
  // Apply persona-specific intensity modulation
  const intensityModifier = Math.min(profile.stateProgression.maxIntensity, 1.0)
  const adjustedTemperature = Math.min(
    stateConfig.temperature * intensityModifier,
    1.0
  )
  
  return {
    enhancedPrompt,
    temperature: adjustedTemperature,
    styleModifiers: stateConfig.styleModifiers,
    responseLength: stateConfig.responseLength,
    debugInfo: {
      originalState: emotionalState,
      appliedInstructions: stateInstructions,
      temperatureAdjustment: adjustedTemperature,
      intensityModifier,
      personaProfile: profile.baseTemperament
    }
  }
}

/**
 * Initialize emotional state for a new debate
 * @param {string} proPersona - Pro side persona name
 * @param {string} conPersona - Con side persona name
 * @returns {Map} Initial emotional state mapping
 */
export function initializeEmotionalStates(proPersona, conPersona) {
  const stateMap = new Map()
  stateMap.set('pro', {
    persona: proPersona,
    currentState: EMOTIONAL_STATES.NEUTRAL,
    stateHistory: [EMOTIONAL_STATES.NEUTRAL],
    lastAnalysis: null
  })
  stateMap.set('con', {
    persona: conPersona,
    currentState: EMOTIONAL_STATES.NEUTRAL,
    stateHistory: [EMOTIONAL_STATES.NEUTRAL],
    lastAnalysis: null
  })
  return stateMap
}

/**
 * Update emotional state based on opponent's argument
 * @param {Map} stateMap - Current state mapping
 * @param {string} side - Side to update ('pro' or 'con')
 * @param {string} opponentArgument - Opponent's argument text
 * @param {number} round - Current round number
 * @returns {Object} Updated state info with analysis
 */
export function updateEmotionalState(stateMap, side, opponentArgument, round) {
  const sideState = stateMap.get(side)
  if (!sideState) return null
  
  const analysis = analyzeArgumentImpact(
    opponentArgument,
    sideState.currentState,
    sideState.persona,
    round
  )
  
  // Update state
  sideState.currentState = analysis.newState
  sideState.stateHistory.push(analysis.newState)
  sideState.lastAnalysis = analysis
  
  // Keep history manageable
  if (sideState.stateHistory.length > 5) {
    sideState.stateHistory = sideState.stateHistory.slice(-5)
  }
  
  return {
    side,
    previousState: sideState.stateHistory[sideState.stateHistory.length - 2] || EMOTIONAL_STATES.NEUTRAL,
    newState: analysis.newState,
    analysis,
    persona: sideState.persona
  }
}