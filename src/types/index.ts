export * from './database'
export * from './strava'

export interface User {
  id: string
  email: string | null
  fullName: string | null
  stravaConnected: boolean
  stravaAthleteId: number | null
  profilePhoto: string | null
  firstname: string | null
  lastname: string | null
  city: string | null
  state: string | null
  country: string | null
}

export interface Activity {
  id: string
  userId: string
  stravaActivityId: number
  name: string
  type: string
  sportType: string | null
  distance: number | null
  movingTime: number | null
  elapsedTime: number | null
  totalElevationGain: number | null
  startDate: string | null
  averageSpeed: number | null
  averageHeartrate: number | null
  maxHeartrate: number | null
  hasHeartrate: boolean
}

export interface ActivitySummary {
  totalActivities: number
  totalDistance: number
  totalMovingTime: number
  totalElevationGain: number
  averageHeartrate: number | null
}
