'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  formatTime,
  formatHeartrate,
  formatDate,
  getActivityIcon,
} from '@/lib/utils'
import { useFormattedUnits } from '@/hooks/use-formatted-units'
import { Calendar, Clock, TrendingUp, Heart } from 'lucide-react'

interface ActivityCardProps {
  activity: {
    id: string
    name: string
    type: string
    sportType: string | null
    distance: number | null
    movingTime: number | null
    totalElevationGain: number | null
    startDate: string | null
    averageSpeed: number | null
    averageHeartrate: number | null
    hasHeartrate: boolean
  }
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const { formatDistance, formatPace, formatElevation } = useFormattedUnits()

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getActivityIcon(activity.type)}</span>
            <div>
              <CardTitle className="text-lg">{activity.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{activity.type}</Badge>
                {activity.sportType && activity.sportType !== activity.type && (
                  <Badge variant="outline" className="text-xs">
                    {activity.sportType}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {formatDate(activity.startDate)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {formatTime(activity.movingTime)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Distance</p>
            <p className="font-semibold">{formatDistance(activity.distance)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Pace</p>
            <p className="font-semibold">{formatPace(activity.averageSpeed)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Elevation
            </p>
            <p className="font-semibold">
              {formatElevation(activity.totalElevationGain)}
            </p>
          </div>
          {activity.hasHeartrate && (
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Heart className="h-3 w-3" />
                Avg HR
              </p>
              <p className="font-semibold">
                {formatHeartrate(activity.averageHeartrate)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
