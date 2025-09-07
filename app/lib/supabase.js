import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to save a debate to the database
export async function saveDebate(debateData) {
  const { data, error } = await supabase
    .from('debates')
    .insert([debateData])
    .select()
    .single()
  
  if (error) {
    console.error('Error saving debate:', error)
    throw error
  }
  
  return data
}

// Helper function to get recent debates
export async function getRecentDebates(limit = 10) {
  const { data, error } = await supabase
    .from('debates')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching debates:', error)
    throw error
  }
  
  return data || []
}

// Helper function to vote on a debate
export async function voteOnDebate(debateId, side, ipAddress) {
  try {
    // First, try to insert the vote
    const { error: voteError } = await supabase
      .from('votes')
      .insert([{ debate_id: debateId, side, ip_address: ipAddress }])
    
    if (voteError) {
      // If it's a unique constraint violation, the user already voted
      if (voteError.code === '23505') {
        throw new Error('You have already voted on this debate')
      }
      throw voteError
    }
    
    // Then increment the vote count
    const { error: incrementError } = await supabase
      .rpc('increment_vote', {
        p_debate_id: debateId,
        p_vote_side: side
      })
    
    if (incrementError) {
      console.error('Error incrementing vote:', incrementError)
      throw incrementError
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error voting on debate:', error)
    throw error
  }
}

// Helper function to get a debate by ID
export async function getDebateById(debateId) {
  const { data, error } = await supabase
    .from('debates')
    .select('*')
    .eq('id', debateId)
    .single()
  
  if (error) {
    console.error('Error fetching debate:', error)
    throw error
  }
  
  return data
}

// Helper function to delete a debate
export async function deleteDebate(debateId) {
  try {
    console.log('Attempting to delete debate with ID:', debateId)
    
    // First check if debate exists
    const { data: existingDebate, error: fetchError } = await supabase
      .from('debates')
      .select('id')
      .eq('id', debateId)
      .single()
    
    console.log('Debate fetch result:', { existingDebate, fetchError })
    
    if (fetchError && fetchError.code === 'PGRST116') {
      throw new Error('Debate not found')
    }
    
    if (fetchError) {
      throw fetchError
    }
    
    // Delete associated votes first (if cascade delete is not configured)
    const { error: votesError } = await supabase
      .from('votes')
      .delete()
      .eq('debate_id', debateId)
    
    if (votesError) {
      console.error('Error deleting votes:', votesError)
      // Continue anyway - votes deletion might fail if table doesn't exist or no votes exist
    }
    
    // Delete the debate
    const { error: deleteError } = await supabase
      .from('debates')
      .delete()
      .eq('id', debateId)
    
    if (deleteError) {
      console.error('Error deleting debate:', deleteError)
      throw deleteError
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error in deleteDebate:', error)
    throw error
  }
}