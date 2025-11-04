import { ActivityType } from './database'

export interface StravaAthlete {
  id: number
  username: string | null
  resource_state: number
  firstname: string
  lastname: string
  bio: string | null
  city: string | null
  state: string | null
  country: string | null
  sex: 'M' | 'F' | null
  premium: boolean
  summit: boolean
  created_at: string
  updated_at: string
  badge_type_id: number
  weight: number | null
  profile_medium: string
  profile: string
  friend: null | boolean
  follower: null | boolean
}

export interface StravaTokenResponse {
  token_type: 'Bearer'
  expires_at: number
  expires_in: number
  refresh_token: string
  access_token: string
  athlete: StravaAthlete
}

export interface StravaTokenRefreshResponse {
  token_type: 'Bearer'
  access_token: string
  expires_at: number
  expires_in: number
  refresh_token: string
}

export interface StravaActivity {
  id: number
  resource_state: number
  external_id: string | null
  upload_id: number | null
  athlete: {
    id: number
    resource_state: number
  }
  name: string
  distance: number
  moving_time: number
  elapsed_time: number
  total_elevation_gain: number
  type: ActivityType
  sport_type: string
  workout_type: number | null
  start_date: string
  start_date_local: string
  timezone: string
  utc_offset: number
  location_city: string | null
  location_state: string | null
  location_country: string | null
  achievement_count: number
  kudos_count: number
  comment_count: number
  athlete_count: number
  photo_count: number
  map: {
    id: string
    polyline: string | null
    resource_state: number
    summary_polyline: string | null
  }
  trainer: boolean
  commute: boolean
  manual: boolean
  private: boolean
  visibility: string
  flagged: boolean
  gear_id: string | null
  start_latlng: [number, number] | null
  end_latlng: [number, number] | null
  average_speed: number
  max_speed: number
  average_cadence?: number
  average_watts?: number
  weighted_average_watts?: number
  kilojoules?: number
  device_watts?: boolean
  has_heartrate: boolean
  average_heartrate?: number
  max_heartrate?: number
  heartrate_opt_out: boolean
  display_hide_heartrate_option: boolean
  elev_high?: number
  elev_low?: number
  upload_id_str?: string
  pr_count: number
  total_photo_count: number
  has_kudoed: boolean
}

export interface StravaWebhookSubscription {
  id: number
  application_id: number
  callback_url: string
  created_at: string
  updated_at: string
}

export interface StravaWebhookEvent {
  aspect_type: 'create' | 'update' | 'delete'
  event_time: number
  object_id: number
  object_type: 'activity' | 'athlete'
  owner_id: number
  subscription_id: number
  updates?: {
    title?: string
    type?: ActivityType
    private?: 'true' | 'false'
    authorized?: 'true' | 'false'
  }
}

export interface StravaError {
  message: string
  errors?: Array<{
    resource: string
    field: string
    code: string
  }>
}
