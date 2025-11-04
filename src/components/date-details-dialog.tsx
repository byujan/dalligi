'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatTime, getActivityIcon } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react'
import { useFormattedUnits } from '@/hooks/use-formatted-units'
import { AddWorkoutDialog } from './add-workout-dialog'

interface Activity {
  id: string
  name: string
  type: string
  distance: number | null
  movingTime: number | null
  startDate: string
  totalElevationGain: number | null
}

interface PlannedWorkout {
  id: string
  date: string
  type: string
  name: string | null
  description: string | null
  duration: number | null
  distance: number | null
  notes: string | null
}

interface DateDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date | null
  activities: Activity[]
  plannedWorkouts: PlannedWorkout[]
  onWorkoutDeleted: () => void
  onWorkoutAdded: () => void
}

export function DateDetailsDialog({
  open,
  onOpenChange,
  selectedDate,
  activities,
  plannedWorkouts,
  onWorkoutDeleted,
  onWorkoutAdded,
}: DateDetailsDialogProps) {
  const { formatDistance, formatElevation } = useFormattedUnits()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (!selectedDate) return null

  const dateKey = format(selectedDate, 'yyyy-MM-dd')
  const dayActivities = activities.filter(
    (a) => format(parseISO(a.startDate), 'yyyy-MM-dd') === dateKey
  )
  const dayWorkouts = plannedWorkouts.filter((w) => w.date === dateKey)

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/workouts?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete workout')
      }

      onWorkoutDeleted()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete workout')
    } finally {
      setDeletingId(null)
    }
  }

  const handleWorkoutAdded = () => {
    onWorkoutAdded()
    setShowAddDialog(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
            <DialogDescription>
              {dayActivities.length + dayWorkouts.length === 0
                ? 'No activities or workouts scheduled for this day'
                : `${dayActivities.length} activity${dayActivities.length !== 1 ? 'ies' : ''}, ${dayWorkouts.length} planned workout${dayWorkouts.length !== 1 ? 's' : ''}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Planned Workouts Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Planned Workouts
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Workout
                </Button>
              </div>

              {dayWorkouts.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm border border-dashed rounded-lg">
                  No workouts planned for this date
                </div>
              ) : (
                <div className="space-y-3">
                  {dayWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="p-4 border border-slate-200 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              {workout.type}
                            </Badge>
                            {workout.name && (
                              <span className="font-medium text-slate-900">
                                {workout.name}
                              </span>
                            )}
                          </div>

                          {workout.description && (
                            <p className="text-sm text-slate-600 mb-2">
                              {workout.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                            {workout.duration && (
                              <div>
                                <span className="font-medium">Duration:</span>{' '}
                                {workout.duration} min
                              </div>
                            )}
                            {workout.distance && (
                              <div>
                                <span className="font-medium">Distance:</span>{' '}
                                {formatDistance(workout.distance)}
                              </div>
                            )}
                          </div>

                          {workout.notes && (
                            <div className="mt-2 text-sm text-slate-600">
                              <span className="font-medium">Notes:</span>{' '}
                              {workout.notes}
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteWorkout(workout.id)}
                          disabled={deletingId === workout.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Previous Activities Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Activities
                </h3>
              </div>

              {dayActivities.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm border border-dashed rounded-lg">
                  No activities recorded for this date
                </div>
              ) : (
                <div className="space-y-3">
                  {dayActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-4 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-slate-900">
                                {activity.name}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {format(parseISO(activity.startDate), 'h:mm a')}
                              </p>
                            </div>
                            <Badge variant="secondary">{activity.type}</Badge>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                            {activity.distance && (
                              <div>
                                <span className="font-medium">Distance:</span>{' '}
                                {formatDistance(activity.distance)}
                              </div>
                            )}
                            {activity.movingTime && (
                              <div>
                                <span className="font-medium">Time:</span>{' '}
                                {formatTime(activity.movingTime)}
                              </div>
                            )}
                            {activity.totalElevationGain &&
                              activity.totalElevationGain > 0 && (
                                <div>
                                  <span className="font-medium">Elevation:</span>{' '}
                                  {formatElevation(activity.totalElevationGain)}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddWorkoutDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        selectedDate={selectedDate}
        onSuccess={handleWorkoutAdded}
      />
    </>
  )
}

