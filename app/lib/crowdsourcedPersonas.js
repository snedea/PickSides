/**
 * Crowdsourced Personas Management Service
 * 
 * This service handles the submission, deduplication, quality checking,
 * and retrieval of community-contributed personas.
 */

import { supabase } from './supabase.js'
import { enrichPersona, convertToEmotionalProfile } from './personaEnrichment.js'
import { researchHistoricalFigure, assessResearchQuality } from './personaResearch.js'

/**
 * Check for potential duplicates using fuzzy matching
 * @param {string} name - Persona name to check
 * @param {string} era - Historical era (optional)
 * @returns {Array} Array of similar personas
 */
export async function findSimilarPersonas(name, era = null) {
  try {
    console.log(`🔍 Checking for duplicates of "${name}" in era "${era}"`)
    
    const { data, error } = await supabase.rpc('find_similar_personas', {
      p_name: name,
      p_era: era,
      p_similarity_threshold: 0.6
    })
    
    if (error) {
      console.error('Error finding similar personas:', error)
      return []
    }
    
    console.log(`Found ${data?.length || 0} similar personas`)
    return data || []
    
  } catch (error) {
    console.error('Error in findSimilarPersonas:', error)
    return []
  }
}

/**
 * Submit a new persona for enrichment and approval
 * @param {Object} submission - Persona submission
 * @param {string} submitterIp - IP address of submitter
 * @returns {Object} Result with persona ID or error
 */
export async function submitPersona(submission, submitterIp) {
  const { name } = submission
  
  try {
    console.log(`📝 Processing persona submission: ${name}`)
    
    // Step 1: Research the historical figure using AI
    console.log('🔍 Starting AI research process...')
    let researchData
    try {
      researchData = await researchHistoricalFigure(name)
    } catch (error) {
      console.log(`❌ Research failed for "${name}": ${error.message}`)
      return {
        success: false,
        error: 'research',
        message: error.message
      }
    }
    
    // Step 2: Check for duplicates using researched era
    const similarPersonas = await findSimilarPersonas(name, researchData.era)
    if (similarPersonas.length > 0) {
      const exactMatch = similarPersonas.find(p => 
        p.name.toLowerCase() === name.toLowerCase() && 
        p.era === researchData.era
      )
      
      if (exactMatch) {
        return {
          success: false,
          error: 'duplicate',
          message: `A persona named "${name}" from ${researchData.era} already exists`,
          existingPersona: exactMatch
        }
      }
      
      // If similar but not exact, show warning but allow submission
      console.log(`⚠️ Similar personas found: ${similarPersonas.map(p => p.name).join(', ')}`)
    }
    
    // Step 3: Enrich the persona using AI with researched data
    console.log('🧠 Starting AI enrichment process...')
    const enrichedProfile = await enrichPersona({
      name: researchData.name,
      era: researchData.era,
      occupation: researchData.occupation,
      context: researchData.context
    })
    
    // Step 3: Quality check - reject if quality is too low
    if (enrichedProfile.quality_score < 0.7) {
      console.log(`❌ Persona "${name}" rejected due to low quality score: ${enrichedProfile.quality_score}`)
      return {
        success: false,
        error: 'quality',
        message: `Unable to generate sufficient information about "${name}". They may not be well-documented historically.`,
        qualityScore: enrichedProfile.quality_score
      }
    }
    
    // Step 4: Extract birth/death years from research data
    const finalBirthYear = researchData.birth_year || enrichedProfile.historical_context?.birth_year || null
    const finalDeathYear = researchData.death_year || enrichedProfile.historical_context?.death_year || null
    
    // Step 5: Save to database with research data
    const personaData = {
      name: researchData.name,
      name_ro: researchData.name, // TODO: Add Romanian name detection/translation
      era: researchData.era,
      occupation: researchData.occupation,
      birth_year: finalBirthYear,
      death_year: finalDeathYear,
      context: researchData.context,
      personality_traits: enrichedProfile.personality_traits,
      linguistic_profile: enrichedProfile.linguistic_profile,
      debate_style: enrichedProfile.debate_style,
      emotional_triggers: enrichedProfile.emotional_triggers,
      historical_context: enrichedProfile.historical_context,
      quality_score: enrichedProfile.quality_score,
      is_approved: enrichedProfile.quality_score >= 0.8, // Auto-approve high quality
      ai_source: `research:${researchData.historical_accuracy || 0.8},enrich:${enrichedProfile.ai_source}`,
      submitter_ip: submitterIp
    }
    
    // Step 6: Save to database
    const { data, error } = await supabase
      .from('crowdsourced_personas')
      .insert([personaData])
      .select()
      .single()
    
    if (error) {
      console.error('Error saving persona:', error)
      throw error
    }
    
    console.log(`✅ Persona "${researchData.name}" created successfully (Quality: ${Math.round(enrichedProfile.quality_score * 100)}%) and saved to database`)
    
    // Step 7: If approved, add to emotional profiles
    if (data.is_approved) {
      await addToEmotionalProfiles(researchData.name, enrichedProfile)
    }
    
    return {
      success: true,
      persona: data,
      qualityScore: enrichedProfile.quality_score,
      autoApproved: data.is_approved
    }
    
  } catch (error) {
    console.error('Error submitting persona:', error)
    return {
      success: false,
      error: 'processing',
      message: `Failed to process "${name}": ${error.message}`
    }
  }
}

/**
 * Get approved crowdsourced personas for use in debates
 * @param {number} limit - Maximum number to return
 * @returns {Array} Array of approved personas
 */
export async function getApprovedPersonas(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('crowdsourced_personas')
      .select('*')
      .eq('is_approved', true)
      .order('usage_count', { ascending: false })
      .order('quality_score', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching approved personas:', error)
      return []
    }
    
    return data || []
    
  } catch (error) {
    console.error('Error in getApprovedPersonas:', error)
    return []
  }
  
  /* TODO: Uncomment when database table is created
  try {
    const { data, error } = await supabase
      .from('crowdsourced_personas')
      .select('*')
      .eq('is_approved', true)
      .order('usage_count', { ascending: false })
      .order('quality_score', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching approved personas:', error)
      return []
    }
    
    return data || []
    
  } catch (error) {
    console.error('Error in getApprovedPersonas:', error)
    return []
  }
  */
}

/**
 * Search for personas by name, era, or occupation
 * @param {string} query - Search query
 * @param {boolean} approvedOnly - Only return approved personas
 * @returns {Array} Array of matching personas
 */
export async function searchPersonas(query, approvedOnly = true) {
  try {
    let queryBuilder = supabase
      .from('crowdsourced_personas')
      .select('*')
      .or(`name.ilike.%${query}%,era.ilike.%${query}%,occupation.ilike.%${query}%`)
    
    if (approvedOnly) {
      queryBuilder = queryBuilder.eq('is_approved', true)
    }
    
    const { data, error } = await queryBuilder
      .order('quality_score', { ascending: false })
      .limit(20)
    
    if (error) {
      console.error('Error searching personas:', error)
      return []
    }
    
    return data || []
    
  } catch (error) {
    console.error('Error in searchPersonas:', error)
    return []
  }
}

/**
 * Increment usage count when persona is used in a debate
 * @param {string} personaName - Name of the persona
 */
export async function incrementPersonaUsage(personaName) {
  try {
    const { data, error } = await supabase
      .from('crowdsourced_personas')
      .select('id')
      .eq('name', personaName)
      .single()
    
    if (error || !data) {
      console.error('Persona not found for usage increment:', personaName)
      return
    }
    
    const { error: updateError } = await supabase.rpc('increment_persona_usage', {
      p_persona_id: data.id
    })
    
    if (updateError) {
      console.error('Error incrementing persona usage:', updateError)
    } else {
      console.log(`📈 Incremented usage count for persona: ${personaName}`)
    }
    
  } catch (error) {
    console.error('Error in incrementPersonaUsage:', error)
  }
}

/**
 * Get persona details by name
 * @param {string} name - Persona name
 * @returns {Object|null} Persona object or null
 */
export async function getPersonaByName(name) {
  try {
    const { data, error } = await supabase
      .from('crowdsourced_personas')
      .select('*')
      .eq('name', name)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      console.error('Error fetching persona by name:', error)
      return null
    }
    
    return data
    
  } catch (error) {
    console.error('Error in getPersonaByName:', error)
    return null
  }
}

/**
 * Add enriched persona to emotional profiles for debate use
 * @param {string} name - Persona name
 * @param {Object} enrichedProfile - AI-generated profile
 */
async function addToEmotionalProfiles(name, enrichedProfile) {
  try {
    // This would dynamically add the persona to the emotional profiles
    // For now, we'll just log it - in a real implementation, you might
    // want to store this in a separate table or update the main emotional profiles
    console.log(`💭 Adding ${name} to emotional profiles with temperament: ${enrichedProfile.emotional_triggers?.base_temperament}`)
    
    const emotionalProfile = convertToEmotionalProfile(enrichedProfile, name)
    
    // In a production system, you might want to:
    // 1. Store this in a separate emotional_profiles table
    // 2. Update the in-memory profiles cache
    // 3. Notify the debate system of the new persona
    
    console.log(`✅ Emotional profile created for ${name}`)
    
  } catch (error) {
    console.error('Error adding to emotional profiles:', error)
  }
}

/**
 * Get recently added personas for community showcasing
 * @param {number} limit - Number of recent personas to return
 * @returns {Array} Array of recent personas
 */
export async function getRecentPersonas(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('crowdsourced_personas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching recent personas:', error)
      return []
    }
    
    return data || []
    
  } catch (error) {
    console.error('Error in getRecentPersonas:', error)
    return []
  }
}

/**
 * Get persona statistics for admin/community display
 * @returns {Object} Statistics about the persona library
 */
export async function getPersonaStatistics() {
  try {
    // Get basic counts
    const { data: allPersonas, error: allError } = await supabase
      .from('crowdsourced_personas')
      .select('quality_score, usage_count, is_approved, created_at')
    
    if (allError) {
      console.error('Error fetching persona statistics:', allError)
      return {
        total: 0,
        approved: 0,
        pending: 0,
        totalUsage: 0,
        averageQuality: 0,
        addedThisWeek: 0
      }
    }
    
    const total = allPersonas.length
    const approved = allPersonas.filter(p => p.is_approved).length
    const pending = total - approved
    const totalUsage = allPersonas.reduce((sum, p) => sum + (p.usage_count || 0), 0)
    const averageQuality = total > 0 ? allPersonas.reduce((sum, p) => sum + (p.quality_score || 0), 0) / total : 0
    
    // Count added this week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const addedThisWeek = allPersonas.filter(p => p.created_at >= oneWeekAgo).length
    
    return {
      total,
      approved,
      pending,
      totalUsage,
      averageQuality: Math.round(averageQuality * 100) / 100,
      addedThisWeek
    }
    
  } catch (error) {
    console.error('Error in getPersonaStatistics:', error)
    return {
      total: 0,
      approved: 0,
      pending: 0,
      totalUsage: 0,
      averageQuality: 0,
      addedThisWeek: 0
    }
  }
}