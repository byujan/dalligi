import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth } from 'date-fns'
import { CalendarView } from '@/components/calendar-view'

async function getActivitiesForMonth(userId: string, date: Date) {
  const supabase = await createClient()
  const start = startOfMonth(date)
  const end = endOfMonth(date)

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .gte('start_date', start.toISOString())
    .lte('start_date', end.toISOString())
    .order('start_date', { ascending: true })

  if (error || !data) return []

  return data.map(activity => ({
    id: activity.id,
    name: activity.name,
    type: activity.type,
    distance: activity.distance,
    movingTime: activity.moving_time,
    startDate: activity.start_date,
    totalElevationGain: activity.total_elevation_gain,
  }))
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string }
}) {
  const user = await requireAuth()
  
  // Parse month and year from search params, or use current date
  let currentDate = new Date()
  if (searchParams?.month && searchParams?.year) {
    const month = parseInt(searchParams.month) - 1 // JavaScript months are 0-indexed
    const year = parseInt(searchParams.year)
    currentDate = new Date(year, month, 1)
  }
  
  const activities = await getActivitiesForMonth(user.id, currentDate)

  return <CalendarView activities={activities} currentDate={currentDate} />
}
