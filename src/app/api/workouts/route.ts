import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    const supabase = await createClient()

    let query = supabase
      .from('planned_workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ workouts: data || [] })
  } catch (error) {
    console.error('Error fetching workouts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch workouts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { date, type, name, description, duration, distance, notes } = body

    if (!date || !type) {
      return NextResponse.json(
        { error: 'Date and type are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('planned_workouts')
      .insert({
        user_id: user.id,
        date,
        type,
        name: name || null,
        description: description || null,
        duration: duration || null,
        distance: distance || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ workout: data })
  } catch (error) {
    console.error('Error creating workout:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create workout' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Workout ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('planned_workouts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workout:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete workout' },
      { status: 500 }
    )
  }
}

