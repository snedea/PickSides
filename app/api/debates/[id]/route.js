import { NextResponse } from 'next/server'
import { deleteDebate } from '../../../lib/supabase.js'

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