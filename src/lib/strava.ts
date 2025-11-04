import { StravaTokenResponse, StravaTokenRefreshResponse, StravaActivity } from '@/types/strava'
import { createServiceClient } from '@/lib/supabase/server'

const STRAVA_API_BASE = 'https://www.strava.com/api/v3'
const STRAVA_OAUTH_BASE = 'https://www.strava.com/oauth'

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<StravaTokenResponse> {
  const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to exchange code: ${error.message || response.statusText}`)
  }

  return response.json()
}

/**
 * Refresh Strava access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<StravaTokenRefreshResponse> {
  const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to refresh token: ${error.message || response.statusText}`)
  }

  return response.json()
}

/**
 * Get valid access token for user (refresh if needed)
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const supabase = createServiceClient()

  const { data: tokenData, error } = await supabase
    .from('strava_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !tokenData) {
    throw new Error('No Strava token found for user')
  }

  // Check if token is expired (with 5 minute buffer)
  const now = Math.floor(Date.now() / 1000)
  const bufferSeconds = 300

  if (tokenData.expires_at <= now + bufferSeconds) {
    // Token expired or about to expire, refresh it
    const refreshedToken = await refreshAccessToken(tokenData.refresh_token)

    // Update token in database
    const { error: updateError } = await supabase
      .from('strava_tokens')
      .update({
        access_token: refreshedToken.access_token,
        refresh_token: refreshedToken.refresh_token,
        expires_at: refreshedToken.expires_at,
      })
      .eq('user_id', userId)

    if (updateError) {
      throw new Error(`Failed to update token: ${updateError.message}`)
    }

    return refreshedToken.access_token
  }

  return tokenData.access_token
}

/**
 * Fetch athlete activities from Strava
 */
export async function fetchAthleteActivities(
  accessToken: string,
  page: number = 1,
  perPage: number = 30
): Promise<StravaActivity[]> {
  const response = await fetch(
    `${STRAVA_API_BASE}/athlete/activities?page=${page}&per_page=${perPage}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch activities: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch a single activity from Strava
 */
export async function fetchActivity(
  accessToken: string,
  activityId: number
): Promise<StravaActivity> {
  const response = await fetch(
    `${STRAVA_API_BASE}/activities/${activityId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch activity: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Sync activities from Strava to database
 */
export async function syncActivities(userId: string, page: number = 1): Promise<number> {
  const supabase = createServiceClient()

  // Get valid access token
  const accessToken = await getValidAccessToken(userId)

  // Fetch activities from Strava
  const activities = await fetchAthleteActivities(accessToken, page, 50)

  if (activities.length === 0) {
    return 0
  }

  // Insert or update activities in database
  const activitiesToUpsert = activities.map(activity => ({
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
  }))

  const { error } = await supabase
    .from('activities')
    .upsert(activitiesToUpsert, {
      onConflict: 'strava_activity_id',
      ignoreDuplicates: false,
    })

  if (error) {
    throw new Error(`Failed to sync activities: ${error.message}`)
  }

  return activities.length
}

/**
 * Create webhook subscription
 */
export async function createWebhookSubscription(callbackUrl: string, verifyToken: string) {
  const response = await fetch(`${STRAVA_API_BASE}/push_subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      callback_url: callbackUrl,
      verify_token: verifyToken,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to create webhook: ${error.message || response.statusText}`)
  }

  return response.json()
}
