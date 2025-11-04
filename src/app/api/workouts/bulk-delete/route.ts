import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { workoutIds } = body

    if (!workoutIds || !Array.isArray(workoutIds) || workoutIds.length === 0) {
      return NextResponse.json(
        { error: 'Workout IDs are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Delete all workouts in the list that belong to the user
    const { error, count } = await supabase
      .from('planned_workouts')
      .delete({ count: 'exact' })
      .in('id', workoutIds)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error bulk deleting workouts:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      deletedCount: count || 0
    })
  } catch (error) {
    console.error('Error bulk deleting workouts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete workouts' },
      { status: 500 }
    )
  }
}
