import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ActivityCard } from '@/components/activity-card'
import { DashboardMetrics } from '@/components/dashboard-metrics'
import { MetricCard } from '@/components/metric-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Heart } from 'lucide-react'
import { ActivitySummary } from '@/types'
import { SyncButton } from '@/components/sync-button'
import Link from 'next/link'

async function getActivities(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching activities:', error)
    return []
  }

  return data.map(activity => ({
    id: activity.id,
    userId: activity.user_id,
    stravaActivityId: activity.strava_activity_id,
    name: activity.name,
    type: activity.type,
    sportType: activity.sport_type,
    distance: activity.distance,
    movingTime: activity.moving_time,
    elapsedTime: activity.elapsed_time,
    totalElevationGain: activity.total_elevation_gain,
    startDate: activity.start_date,
    averageSpeed: activity.average_speed,
    averageHeartrate: activity.average_heartrate,
    maxHeartrate: activity.max_heartrate,
    hasHeartrate: activity.has_heartrate,
  }))
}

async function getActivitySummary(userId: string): Promise<ActivitySummary> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('activities')
    .select('distance, moving_time, total_elevation_gain, average_heartrate, has_heartrate')
    .eq('user_id', userId)

  if (error || !data) {
    return {
      totalActivities: 0,
      totalDistance: 0,
      totalMovingTime: 0,
      totalElevationGain: 0,
      averageHeartrate: null,
    }
  }

  const totalActivities = data.length
  const totalDistance = data.reduce((sum, a) => sum + (a.distance || 0), 0)
  const totalMovingTime = data.reduce((sum, a) => sum + (a.moving_time || 0), 0)
  const totalElevationGain = data.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0)

  // Calculate average heartrate from activities that have heartrate data
  const activitiesWithHR = data.filter(a => a.has_heartrate && a.average_heartrate)
  const averageHeartrate = activitiesWithHR.length > 0
    ? activitiesWithHR.reduce((sum, a) => sum + (a.average_heartrate || 0), 0) / activitiesWithHR.length
    : null

  return {
    totalActivities,
    totalDistance,
    totalMovingTime,
    totalElevationGain,
    averageHeartrate,
  }
}

export default async function DashboardPage() {
  const user = await requireAuth()

  // Show Strava connection prompt if not connected
  if (!user.stravaConnected) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Connect to Strava</CardTitle>
          <CardDescription>
            You need to connect your Strava account to view your activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/onboarding">
            <Button variant="strava" size="lg" className="w-full">
              <Activity className="mr-2 h-5 w-5" />
              Connect with Strava
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const activities = await getActivities(user.id)
  const summary = await getActivitySummary(user.id)

  return (
    <>
        {/* Summary Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
              <p className="text-slate-600 mt-1">
                Track your training and performance
              </p>
            </div>
            <SyncButton />
          </div>

          <DashboardMetrics
            totalActivities={summary.totalActivities}
            totalDistance={summary.totalDistance}
            totalMovingTime={summary.totalMovingTime}
            totalElevationGain={summary.totalElevationGain}
          />

          {summary.averageHeartrate && (
            <div className="mt-4">
              <MetricCard
                title="Average Heart Rate"
                value={`${Math.round(summary.averageHeartrate)} bpm`}
                icon={Heart}
                description="Across all activities with HR data"
              />
            </div>
          )}
        </div>

        {/* Activities List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-900">
              Recent Activities
            </h3>
            <p className="text-sm text-slate-600">
              Showing {activities.length} most recent
            </p>
          </div>

          {activities.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No activities yet
              </h3>
              <p className="text-slate-600 mb-4">
                Click &quot;Sync Activities&quot; to import your Strava activities
              </p>
              <SyncButton />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activities.map(activity => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </div>
    </>
  )
}
