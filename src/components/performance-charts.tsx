'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, parseISO, startOfWeek, endOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth } from 'date-fns'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useFormattedUnits } from '@/hooks/use-formatted-units'

interface Activity {
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

interface PerformanceChartsProps {
  activities: Activity[]
}

export function PerformanceCharts({ activities }: PerformanceChartsProps) {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly')
  const { units, formatDistance, formatPace } = useFormattedUnits()

  // Prepare data for weekly distance chart
  const weeklyData = prepareWeeklyData(activities, units)
  const monthlyData = prepareMonthlyData(activities, units)
  const paceData = preparePaceData(activities, units)
  const heartRateData = prepareHeartRateData(activities)
  const activityTypeData = prepareActivityTypeData(activities, units)

  const chartData = view === 'weekly' ? weeklyData : monthlyData
  
  const distanceUnit = units === 'imperial' ? 'mi' : 'km'
  const distanceLabel = units === 'imperial' ? 'Distance (mi)' : 'Distance (km)'
  const paceUnit = units === 'imperial' ? '/mi' : '/km'

  return (
    <div className="space-y-6">
      {/* Distance Over Time */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Distance Over Time</CardTitle>
              <CardDescription>Track your training volume</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={view === 'weekly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('weekly')}
              >
                Weekly
              </Button>
              <Button
                variant={view === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('monthly')}
              >
                Monthly
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="period"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `${value}${distanceUnit}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} ${distanceUnit}`, 'Distance']}
                />
                <Bar dataKey="distance" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              No data available for the selected period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pace Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Pace Trend</CardTitle>
          <CardDescription>Monitor your speed improvements</CardDescription>
        </CardHeader>
        <CardContent>
          {paceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={paceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value: number) => {
                    const minutes = Math.floor(value / 60)
                    const seconds = Math.round(value % 60)
                    return `${minutes}:${seconds.toString().padStart(2, '0')}`
                  }}
                  label={{ value: `pace${paceUnit}`, angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number) => [formatPaceFromSeconds(value, paceUnit), 'Pace']}
                />
                <Line
                  type="monotone"
                  dataKey="pace"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              No pace data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Heart Rate Zones */}
      {heartRateData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Heart Rate Trend</CardTitle>
            <CardDescription>Track your cardiovascular fitness</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={heartRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `${value}`}
                  label={{ value: 'bpm', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number) => [`${Math.round(value)} bpm`, 'Heart Rate']}
                />
                <Line
                  type="monotone"
                  dataKey="heartRate"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Activity Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Type Distribution</CardTitle>
          <CardDescription>Breakdown by activity type (last 3 months)</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="type"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} name="Activities" />
                <Bar dataKey="distance" fill="#3b82f6" radius={[8, 8, 0, 0]} name={distanceLabel} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              No activity data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function prepareWeeklyData(activities: Activity[], units: 'metric' | 'imperial') {
  if (activities.length === 0) return []

  const weeks: { [key: string]: number } = {}

  activities.forEach(activity => {
    const date = parseISO(activity.start_date)
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }) // Monday
    const weekKey = format(weekStart, 'MMM dd')

    if (!weeks[weekKey]) {
      weeks[weekKey] = 0
    }
    // Convert to appropriate unit (meters to km or miles)
    if (units === 'imperial') {
      weeks[weekKey] += activity.distance * 0.000621371 // Convert to miles
    } else {
    weeks[weekKey] += activity.distance / 1000 // Convert to km
    }
  })

  return Object.entries(weeks)
    .map(([period, distance]) => ({
      period,
      distance: parseFloat(distance.toFixed(2)),
    }))
    .slice(-12) // Last 12 weeks
}

function prepareMonthlyData(activities: Activity[], units: 'metric' | 'imperial') {
  if (activities.length === 0) return []

  const months: { [key: string]: number } = {}

  activities.forEach(activity => {
    const date = parseISO(activity.start_date)
    const monthKey = format(date, 'MMM yyyy')

    if (!months[monthKey]) {
      months[monthKey] = 0
    }
    // Convert to appropriate unit (meters to km or miles)
    if (units === 'imperial') {
      months[monthKey] += activity.distance * 0.000621371 // Convert to miles
    } else {
    months[monthKey] += activity.distance / 1000 // Convert to km
    }
  })

  return Object.entries(months).map(([period, distance]) => ({
    period,
    distance: parseFloat(distance.toFixed(2)),
  }))
}

// Helper function to format seconds into MM:SS pace format
function formatPaceFromSeconds(totalSeconds: number, unit: string): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.round(totalSeconds % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')} ${unit}`
}

function preparePaceData(activities: Activity[], units: 'metric' | 'imperial') {
  return activities
    .filter(a => a.average_speed > 0 && a.distance > (units === 'imperial' ? 1609 : 1000)) // At least 1 mile or 1km
    .map(activity => {
      let paceSeconds: number
      if (units === 'imperial') {
        paceSeconds = 1609.34 / activity.average_speed // seconds per mile
      } else {
        paceSeconds = 1000 / activity.average_speed // seconds per km
      }
      return {
        date: format(parseISO(activity.start_date), 'MMM dd'),
        pace: paceSeconds, // Store as seconds for accurate chart plotting
        name: activity.name,
      }
    })
    .slice(-20) // Last 20 activities
}

function prepareHeartRateData(activities: Activity[]) {
  return activities
    .filter(a => a.average_heartrate)
    .map(activity => ({
      date: format(parseISO(activity.start_date), 'MMM dd'),
      heartRate: activity.average_heartrate,
      name: activity.name,
    }))
    .slice(-20) // Last 20 activities
}

function prepareActivityTypeData(activities: Activity[], units: 'metric' | 'imperial') {
  const typeStats: { [key: string]: { count: number; distance: number } } = {}

  activities.forEach(activity => {
    if (!typeStats[activity.type]) {
      typeStats[activity.type] = { count: 0, distance: 0 }
    }
    typeStats[activity.type].count += 1
    // Convert to appropriate unit
    if (units === 'imperial') {
      typeStats[activity.type].distance += activity.distance * 0.000621371 // Convert to miles
    } else {
      typeStats[activity.type].distance += activity.distance / 1000 // Convert to km
    }
  })

  return Object.entries(typeStats).map(([type, stats]) => ({
    type,
    count: stats.count,
    distance: parseFloat(stats.distance.toFixed(2)),
  }))
}
