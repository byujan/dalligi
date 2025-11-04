export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ActivityType =
  | 'Run' | 'Ride' | 'Swim' | 'Walk' | 'Hike' | 'VirtualRide'
  | 'AlpineSki' | 'BackcountrySki' | 'Canoeing' | 'Crossfit'
  | 'EBikeRide' | 'Elliptical' | 'Golf' | 'Handcycle' | 'IceSkate'
  | 'InlineSkate' | 'Kayaking' | 'Kitesurf' | 'NordicSki' | 'RockClimbing'
  | 'RollerSki' | 'Rowing' | 'Snowboard' | 'Snowshoe' | 'Soccer'
  | 'StairStepper' | 'StandUpPaddling' | 'Surfing' | 'VirtualRun'
  | 'WeightTraining' | 'Wheelchair' | 'Windsurf' | 'Workout' | 'Yoga'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          strava_athlete_id: number
          email: string | null
          firstname: string | null
          lastname: string | null
          profile_photo: string | null
          city: string | null
          state: string | null
          country: string | null
          sex: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          strava_athlete_id: number
          email?: string | null
          firstname?: string | null
          lastname?: string | null
          profile_photo?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          sex?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          strava_athlete_id?: number
          email?: string | null
          firstname?: string | null
          lastname?: string | null
          profile_photo?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          sex?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      strava_tokens: {
        Row: {
          id: string
          user_id: string
          access_token: string
          refresh_token: string
          expires_at: number
          scope: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          access_token: string
          refresh_token: string
          expires_at: number
          scope?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          access_token?: string
          refresh_token?: string
          expires_at?: number
          scope?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string
          strava_activity_id: number
          name: string
          type: ActivityType
          sport_type: string | null
          distance: number | null
          moving_time: number | null
          elapsed_time: number | null
          total_elevation_gain: number | null
          start_date: string | null
          start_date_local: string | null
          timezone: string | null
          average_speed: number | null
          max_speed: number | null
          average_heartrate: number | null
          max_heartrate: number | null
          average_cadence: number | null
          average_watts: number | null
          kilojoules: number | null
          device_watts: boolean | null
          has_heartrate: boolean
          elev_high: number | null
          elev_low: number | null
          pr_count: number
          achievement_count: number
          kudos_count: number
          comment_count: number
          athlete_count: number
          map_polyline: string | null
          map_summary_polyline: string | null
          gear_id: string | null
          external_id: string | null
          upload_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          strava_activity_id: number
          name: string
          type: ActivityType
          sport_type?: string | null
          distance?: number | null
          moving_time?: number | null
          elapsed_time?: number | null
          total_elevation_gain?: number | null
          start_date?: string | null
          start_date_local?: string | null
          timezone?: string | null
          average_speed?: number | null
          max_speed?: number | null
          average_heartrate?: number | null
          max_heartrate?: number | null
          average_cadence?: number | null
          average_watts?: number | null
          kilojoules?: number | null
          device_watts?: boolean | null
          has_heartrate?: boolean
          elev_high?: number | null
          elev_low?: number | null
          pr_count?: number
          achievement_count?: number
          kudos_count?: number
          comment_count?: number
          athlete_count?: number
          map_polyline?: string | null
          map_summary_polyline?: string | null
          gear_id?: string | null
          external_id?: string | null
          upload_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          strava_activity_id?: number
          name?: string
          type?: ActivityType
          sport_type?: string | null
          distance?: number | null
          moving_time?: number | null
          elapsed_time?: number | null
          total_elevation_gain?: number | null
          start_date?: string | null
          start_date_local?: string | null
          timezone?: string | null
          average_speed?: number | null
          max_speed?: number | null
          average_heartrate?: number | null
          max_heartrate?: number | null
          average_cadence?: number | null
          average_watts?: number | null
          kilojoules?: number | null
          device_watts?: boolean | null
          has_heartrate?: boolean
          elev_high?: number | null
          elev_low?: number | null
          pr_count?: number
          achievement_count?: number
          kudos_count?: number
          comment_count?: number
          athlete_count?: number
          map_polyline?: string | null
          map_summary_polyline?: string | null
          gear_id?: string | null
          external_id?: string | null
          upload_id?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
