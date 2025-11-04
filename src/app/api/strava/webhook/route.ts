import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchActivity, getValidAccessToken } from '@/lib/strava'
import { StravaWebhookEvent } from '@/types/strava'

/**
 * Handle webhook verification (GET request)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook verified successfully')
    return NextResponse.json({ 'hub.challenge': challenge })
  } else {
    console.error('Webhook verification failed')
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 403 }
    )
  }
}

/**
 * Handle webhook events (POST request)
 */
export async function POST(request: NextRequest) {
  try {
    const event: StravaWebhookEvent = await request.json()

    console.log('Received webhook event:', event)

    // Only process activity events
    if (event.object_type !== 'activity') {
      return NextResponse.json({ message: 'Event ignored' })
    }

    const supabase = createServiceClient()

    // Get user by Strava athlete ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('strava_athlete_id', event.owner_id)
      .single()

    if (userError || !user) {
      console.error('User not found:', event.owner_id)
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const userId = user.id

    // Handle different event types
    if (event.aspect_type === 'create') {
      // Fetch and store the new activity
      try {
        const accessToken = await getValidAccessToken(userId)
        const activity = await fetchActivity(accessToken, event.object_id)

        const { error: insertError } = await supabase
          .from('activities')
          .insert({
            user_id: userId,
            strava_activity_id: activity.id,
            name: activity.name,
            type: activity.type,
            sport_type: activity.sport_type,
            distance: activity.distance,
            moving_time: activity.moving_time,
            elapsed_time: activity.elapsed_time,
            total_elevation_gain: activity.total_elevation_gain,
            start_date: activity.start_date,
            start_date_local: activity.start_date_local,
            timezone: activity.timezone,
            average_speed: activity.average_speed,
            max_speed: activity.max_speed,
            average_heartrate: activity.average_heartrate,
            max_heartrate: activity.max_heartrate,
            average_cadence: activity.average_cadence,
            average_watts: activity.average_watts,
            kilojoules: activity.kilojoules,
            device_watts: activity.device_watts,
            has_heartrate: activity.has_heartrate,
            elev_high: activity.elev_high,
            elev_low: activity.elev_low,
            pr_count: activity.pr_count,
            achievement_count: activity.achievement_count,
            kudos_count: activity.kudos_count,
            comment_count: activity.comment_count,
            athlete_count: activity.athlete_count,
            map_polyline: activity.map.polyline,
            map_summary_polyline: activity.map.summary_polyline,
            gear_id: activity.gear_id,
            external_id: activity.external_id,
            upload_id: activity.upload_id,
          })

        if (insertError) {
          console.error('Error inserting activity:', insertError)
          throw insertError
        }

        console.log('Activity created:', activity.id)
      } catch (error) {
        console.error('Error processing create event:', error)
        return NextResponse.json(
          { error: 'Failed to process activity' },
          { status: 500 }
        )
      }
    } else if (event.aspect_type === 'update') {
      // Update existing activity
      try {
        const accessToken = await getValidAccessToken(userId)
        const activity = await fetchActivity(accessToken, event.object_id)

        const { error: updateError } = await supabase
          .from('activities')
          .update({
            name: activity.name,
            type: activity.type,
            sport_type: activity.sport_type,
            distance: activity.distance,
            moving_time: activity.moving_time,
            elapsed_time: activity.elapsed_time,
            total_elevation_gain: activity.total_elevation_gain,
            average_speed: activity.average_speed,
            max_speed: activity.max_speed,
            average_heartrate: activity.average_heartrate,
            max_heartrate: activity.max_heartrate,
            kudos_count: activity.kudos_count,
            comment_count: activity.comment_count,
          })
          .eq('strava_activity_id', event.object_id)

        if (updateError) {
          console.error('Error updating activity:', updateError)
          throw updateError
        }

        console.log('Activity updated:', event.object_id)
      } catch (error) {
        console.error('Error processing update event:', error)
        return NextResponse.json(
          { error: 'Failed to update activity' },
          { status: 500 }
        )
      }
    } else if (event.aspect_type === 'delete') {
      // Delete activity
      const { error: deleteError } = await supabase
        .from('activities')
        .delete()
        .eq('strava_activity_id', event.object_id)

      if (deleteError) {
        console.error('Error deleting activity:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete activity' },
          { status: 500 }
        )
      }

      console.log('Activity deleted:', event.object_id)
    }

    return NextResponse.json({ message: 'Event processed successfully' })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
