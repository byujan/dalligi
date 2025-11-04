import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { AnalyticsView } from '@/components/analytics-view'
import { subMonths } from 'date-fns'

interface ActivityData {
  id: string
  name: string
  type: string
  distance: number
  moving_time: number
  start_date: string
  average_speed: number
  average_heartrate: number | null
  total_elevation_gain: number
}

async function getAnalyticsData(userId: string) {
  const supabase = await createClient()

  // Get last 3 months of activities for charts
  const threeMonthsAgo = subMonths(new Date(), 3)

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .gte('start_date', threeMonthsAgo.toISOString())
    .order('start_date', { ascending: true })

  if (error || !data) return []

  return data.map(activity => ({
    id: activity.id,
    name: activity.name,
    type: activity.type,
    distance: activity.distance || 0,
    moving_time: activity.moving_time || 0,
    start_date: activity.start_date,
    average_speed: activity.average_speed || 0,
    average_heartrate: activity.average_heartrate,
    total_elevation_gain: activity.total_elevation_gain || 0,
  }))
}

async function getPersonalRecords(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('distance', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) {
    return {
      longestDistance: null,
      longestTime: null,
      fastestPace: null,
      mostElevation: null,
    }
  }

  // Get various records
  const { data: longestRun } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('distance', { ascending: false })
    .limit(1)

  const { data: longestTime } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('moving_time', { ascending: false })
    .limit(1)

  const { data: fastestPace } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .gt('distance', 1000) // At least 1km
    .order('average_speed', { ascending: false })
    .limit(1)

  const { data: mostElevation } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('total_elevation_gain', { ascending: false })
    .limit(1)

  return {
    longestDistance: longestRun?.[0] || null,
    longestTime: longestTime?.[0] || null,
    fastestPace: fastestPace?.[0] || null,
    mostElevation: mostElevation?.[0] || null,
  }
}

export default async function AnalyticsPage() {
  const user = await requireAuth()
  const activities = await getAnalyticsData(user.id)
  const records = await getPersonalRecords(user.id)

  return <AnalyticsView activities={activities} records={records} />
}
