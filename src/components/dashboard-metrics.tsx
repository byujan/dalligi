'use client'

import { MetricCard } from '@/components/metric-card'
import { Activity, Clock, TrendingUp } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import { useFormattedUnits } from '@/hooks/use-formatted-units'

interface DashboardMetricsProps {
  totalActivities: number
  totalDistance: number
  totalMovingTime: number
  totalElevationGain: number
}

export function DashboardMetrics({
  totalActivities,
  totalDistance,
  totalMovingTime,
  totalElevationGain,
}: DashboardMetricsProps) {
  const { formatDistance, formatElevation } = useFormattedUnits()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Activities"
        value={totalActivities.toString()}
        icon={Activity}
        description="All time"
      />
      <MetricCard
        title="Total Distance"
        value={formatDistance(totalDistance)}
        icon={TrendingUp}
        description="All time"
      />
      <MetricCard
        title="Total Time"
        value={formatTime(totalMovingTime)}
        icon={Clock}
        description="Moving time"
      />
      <MetricCard
        title="Total Elevation"
        value={formatElevation(totalElevationGain)}
        icon={TrendingUp}
        description="All time gain"
      />
    </div>
  )
}
