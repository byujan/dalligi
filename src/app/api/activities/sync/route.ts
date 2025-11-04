import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { syncActivities } from '@/lib/strava'

export async function POST() {
  try {
    const user = await requireAuth()

    // Sync activities from Strava
    const count = await syncActivities(user.id)

    return NextResponse.json({
      success: true,
      message: `Synced ${count} activities`,
      count,
    })
  } catch (error) {
    console.error('Error syncing activities:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync activities',
      },
      { status: 500 }
    )
  }
}
