import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    // Fetch all training plans for the user
    const { data: plans, error } = await supabase
      .from('training_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error fetching training plans:', error)

      // If the table doesn't exist yet, return empty array
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({ plans: [] })
      }

      throw error
    }

    // For each plan, get the workout count and date range
    const plansWithDetails = await Promise.all(
      (plans || []).map(async (plan) => {
        const { data: workouts, error: workoutsError } = await supabase
          .from('planned_workouts')
          .select('id, date')
          .eq('training_plan_id', plan.id)
          .order('date', { ascending: true })

        if (workoutsError) {
          console.error('Error fetching workouts for plan:', workoutsError)
          return {
            ...plan,
            workoutCount: 0,
            startDate: null,
            endDate: null,
          }
        }

        return {
          ...plan,
          workoutCount: workouts?.length || 0,
          startDate: workouts?.[0]?.date || null,
          endDate: workouts?.[workouts.length - 1]?.date || null,
        }
      })
    )

    return NextResponse.json({ plans: plansWithDetails })
  } catch (error) {
    console.error('Error fetching training plans:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch training plans' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('id')

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Count workouts before deletion for logging
    const { count: workoutCount } = await supabase
      .from('planned_workouts')
      .select('*', { count: 'exact', head: true })
      .eq('training_plan_id', planId)
      .eq('user_id', user.id)

    console.log(`Deleting training plan ${planId} with ${workoutCount || 0} workouts`)

    // Delete the plan - workouts should cascade delete automatically
    // If cascade isn't working, we'll manually delete workouts first
    const { error: planError } = await supabase
      .from('training_plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', user.id)

    if (planError) {
      console.error('Error deleting plan:', planError)

      // If cascade delete failed, try manual deletion
      console.log('Attempting manual workout deletion...')
      const { error: workoutsError } = await supabase
        .from('planned_workouts')
        .delete()
        .eq('training_plan_id', planId)
        .eq('user_id', user.id)

      if (workoutsError) {
        console.error('Error deleting workouts:', workoutsError)
        throw workoutsError
      }

      // Try deleting plan again
      const { error: planError2 } = await supabase
        .from('training_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', user.id)

      if (planError2) throw planError2
    }

    // Verify workouts were deleted
    const { count: remainingCount } = await supabase
      .from('planned_workouts')
      .select('*', { count: 'exact', head: true })
      .eq('training_plan_id', planId)

    console.log(`Workouts remaining after deletion: ${remainingCount || 0}`)

    return NextResponse.json({
      success: true,
      deletedWorkouts: workoutCount || 0,
      remainingWorkouts: remainingCount || 0
    })
  } catch (error) {
    console.error('Error deleting training plan:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete training plan' },
      { status: 500 }
    )
  }
}
