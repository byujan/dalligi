'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatTime } from '@/lib/utils'
import { BarChart3, TrendingUp, Award, Activity, Heart, Clock } from 'lucide-react'
import { PerformanceCharts } from '@/components/performance-charts'
import { format } from 'date-fns'
import { useFormattedUnits } from '@/hooks/use-formatted-units'

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

interface PersonalRecord {
  id: string
  name: string
  distance: number
  moving_time: number
  average_speed: number
  total_elevation_gain: number
  start_date: string
}

interface AnalyticsViewProps {
  activities: ActivityData[]
  records: {
    longestDistance: PersonalRecord | null
    longestTime: PersonalRecord | null
    fastestPace: PersonalRecord | null
    mostElevation: PersonalRecord | null
  }
}

function calculateMetrics(activities: ActivityData[]) {
  const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0)
  const totalTime = activities.reduce((sum, a) => sum + a.moving_time, 0)
  const avgDistance = activities.length > 0 ? totalDistance / activities.length : 0

  // Calculate average heart rate from activities that have it
  const activitiesWithHR = activities.filter(a => a.average_heartrate)
  const avgHeartRate = activitiesWithHR.length > 0
    ? activitiesWithHR.reduce((sum, a) => sum + (a.average_heartrate || 0), 0) / activitiesWithHR.length
    : null

  // Calculate training load (simple TSS-like metric)
  const trainingLoad = activities.reduce((sum, a) => {
    const durationHours = a.moving_time / 3600
    const intensity = a.average_speed > 0 ? Math.min(a.average_speed / 3.5, 2) : 1
    return sum + (durationHours * intensity * 100)
  }, 0)

  return {
    totalDistance,
    totalTime,
    avgDistance,
    avgHeartRate,
    trainingLoad,
  }
}

export function AnalyticsView({ activities, records }: AnalyticsViewProps) {
  const { formatDistance, formatPace, formatElevation } = useFormattedUnits()
  const metrics = calculateMetrics(activities)

  // Calculate average pace - need average speed to calculate pace properly
  // We'll use the total distance and time to get average speed, then format pace
  const avgSpeed = metrics.totalTime > 0 && metrics.totalDistance > 0
    ? metrics.totalDistance / metrics.totalTime
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-slate-900">Performance Analytics</h1>
        </div>
        <p className="text-slate-600">Track your progress and analyze your training</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Avg Distance
            </CardDescription>
            <CardTitle className="text-2xl">
              {formatDistance(metrics.avgDistance)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600">
              Per activity (last 3 months)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Pace
            </CardDescription>
            <CardTitle className="text-2xl">
              {avgSpeed > 0 ? formatPace(avgSpeed) : 'N/A'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600">
              Average across all runs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Avg Heart Rate
            </CardDescription>
            <CardTitle className="text-2xl">
              {metrics.avgHeartRate ? `${Math.round(metrics.avgHeartRate)} bpm` : 'N/A'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600">
              {activities.filter(a => a.average_heartrate).length} activities with HR
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Training Load
            </CardDescription>
            <CardTitle className="text-2xl">
              {Math.round(metrics.trainingLoad)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600">
              Estimated training stress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <PerformanceCharts activities={activities} />

      {/* Personal Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <CardTitle>Personal Records</CardTitle>
          </div>
          <CardDescription>Your best performances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Longest Distance */}
            {records.longestDistance && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-white border border-blue-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 mb-1">Longest Distance</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatDistance(records.longestDistance.distance)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {records.longestDistance.name} • {format(new Date(records.longestDistance.start_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            )}

            {/* Longest Time */}
            {records.longestTime && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-br from-green-50 to-white border border-green-100">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 mb-1">Longest Duration</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatTime(records.longestTime.moving_time)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {records.longestTime.name} • {format(new Date(records.longestTime.start_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            )}

            {/* Fastest Pace */}
            {records.fastestPace && records.fastestPace.average_speed > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-white border border-purple-100">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 mb-1">Fastest Pace</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatPace(records.fastestPace.average_speed)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {records.fastestPace.name} • {format(new Date(records.fastestPace.start_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            )}

            {/* Most Elevation */}
            {records.mostElevation && records.mostElevation.total_elevation_gain > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-br from-orange-50 to-white border border-orange-100">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 mb-1">Most Elevation</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatElevation(records.mostElevation.total_elevation_gain)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {records.mostElevation.name} • {format(new Date(records.mostElevation.start_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {!records.longestDistance && (
            <p className="text-center text-slate-500 py-8">
              No activities yet. Get out there and set some records!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Training Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Training Insights</CardTitle>
          <CardDescription>Analysis of your recent training</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Activity Count */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-900">Total Activities</p>
                <p className="text-xs text-slate-600 mt-1">Last 3 months</p>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {activities.length}
              </Badge>
            </div>

            {/* Consistency */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-900">Weekly Average</p>
                <p className="text-xs text-slate-600 mt-1">Activities per week</p>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {(activities.length / 12).toFixed(1)}
              </Badge>
            </div>

            {/* Total Distance */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-900">Total Distance</p>
                <p className="text-xs text-slate-600 mt-1">Last 3 months</p>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {formatDistance(metrics.totalDistance)}
              </Badge>
            </div>

            {/* Total Time */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-900">Total Time</p>
                <p className="text-xs text-slate-600 mt-1">Moving time</p>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {formatTime(metrics.totalTime)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

