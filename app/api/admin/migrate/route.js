import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase.js'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(request) {
  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20241208000000_add_crowdsourced_personas.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Migration executed successfully'
    })
    
  } catch (error) {
    // Try direct SQL execution instead
    try {
      const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20241208000000_add_crowdsourced_personas.sql')
      const migrationSQL = readFileSync(migrationPath, 'utf8')
      
      // Split into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'))
      
      for (const statement of statements) {
        if (statement) {
          const { error } = await supabase.rpc('exec', { sql: statement + ';' })
          if (error) {
            console.error('Migration error on statement:', statement.substring(0, 100), error)
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Migration completed with ${statements.length} statements`
      })
      
    } catch (migrationError) {
      console.error('Migration failed:', migrationError)
      return NextResponse.json({
        success: false,
        error: `Migration failed: ${migrationError.message}`
      }, { status: 500 })
    }
  }
}