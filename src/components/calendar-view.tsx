'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatTime, getActivityIcon } from '@/lib/utils'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isToday, parseISO, addMonths, subMonths } from 'date-fns'
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Trash2, CheckSquare, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFormattedUnits } from '@/hooks/use-formatted-units'
import { DateDetailsDialog } from '@/components/date-details-dialog'

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

interface CalendarViewProps {
  activities: Activity[]
  currentDate?: Date
}

export function CalendarView({ activities, currentDate: initialDate }: CalendarViewProps) {
  const router = useRouter()
  const { formatDistance, formatElevation } = useFormattedUnits()
  const [currentDate, setCurrentDate] = useState<Date>(initialDate || new Date())
  const [plannedWorkouts, setPlannedWorkouts] = useState<PlannedWorkout[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  // Update currentDate when prop changes
  useEffect(() => {
    if (initialDate) {
      setCurrentDate(initialDate)
    }
  }, [initialDate])

  // Fetch planned workouts
  useEffect(() => {
    async function fetchWorkouts() {
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      const startStr = format(start, 'yyyy-MM-dd')
      const endStr = format(end, 'yyyy-MM-dd')
      
      console.log('Fetching workouts for:', { currentDate: currentDate.toISOString(), start: startStr, end: endStr })

      try {
        const response = await fetch(
          `/api/workouts?start=${startStr}&end=${endStr}`
        )
        const data = await response.json()
        setPlannedWorkouts(data.workouts || [])
      } catch (error) {
        console.error('Error fetching workouts:', error)
      }
    }

    fetchWorkouts()
  }, [currentDate])

  // Group activities by date
  const activitiesByDate = activities.reduce((acc, activity) => {
    const dateKey = format(parseISO(activity.startDate), 'yyyy-MM-dd')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(activity)
    return acc
  }, {} as Record<string, typeof activities>)

  // Group planned workouts by date
  const workoutsByDate = plannedWorkouts.reduce((acc, workout) => {
    const dateKey = workout.date
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(workout)
    return acc
  }, {} as Record<string, PlannedWorkout[]>)

  const handleDateClick = (day: Date) => {
    setSelectedDate(day)
    setIsDialogOpen(true)
  }

  const handleWorkoutAdded = () => {
    // Refetch workouts
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    fetch(
      `/api/workouts?start=${format(start, 'yyyy-MM-dd')}&end=${format(end, 'yyyy-MM-dd')}`
    )
      .then((res) => res.json())
      .then((data) => setPlannedWorkouts(data.workouts || []))
      .catch(console.error)
  }

  const handleWorkoutDeleted = () => {
    handleWorkoutAdded() // Refetch workouts
  }

  const navigateToMonth = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1)
    setCurrentDate(newDate)
    // Clear selections when changing months
    setSelectedDates(new Set())
    setIsSelectMode(false)
    // Update URL with new month and year
    const month = newDate.getMonth() + 1
    const year = newDate.getFullYear()
    router.push(`/dashboard/calendar?month=${month}&year=${year}`)
  }

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode)
    setSelectedDates(new Set())
  }

  const toggleDateSelection = (dateKey: string) => {
    const newSelected = new Set(selectedDates)
    if (newSelected.has(dateKey)) {
      newSelected.delete(dateKey)
    } else {
      newSelected.add(dateKey)
    }
    setSelectedDates(newSelected)
  }

  const handleDateClickInSelectMode = (day: Date, e: React.MouseEvent) => {
    e.stopPropagation()
    const dateKey = format(day, 'yyyy-MM-dd')
    const dayWorkouts = workoutsByDate[dateKey] || []

    // Only allow selection if there are workouts on this day
    if (dayWorkouts.length > 0) {
      toggleDateSelection(dateKey)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedDates.size === 0) return

    const workoutCount = Array.from(selectedDates).reduce((count, dateKey) => {
      return count + (workoutsByDate[dateKey]?.length || 0)
    }, 0)

    if (!confirm(`Are you sure you want to delete ${workoutCount} workout(s) from ${selectedDates.size} day(s)?`)) {
      return
    }

    setIsDeleting(true)
    try {
      // Collect all workout IDs from selected dates
      const workoutIds = Array.from(selectedDates).flatMap((dateKey) => {
        return (workoutsByDate[dateKey] || []).map((w) => w.id)
      })

      // Delete all workouts
      const response = await fetch('/api/workouts/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutIds }),
      })

      if (!response.ok) throw new Error('Failed to delete workouts')

      // Refresh workouts
      handleWorkoutAdded()
      setSelectedDates(new Set())
      setIsSelectMode(false)
    } catch (error) {
      console.error('Error deleting workouts:', error)
      alert('Failed to delete workouts. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Generate calendar days
  const start = startOfMonth(currentDate)
  const end = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start, end })

  // Get day of week for first day (0 = Sunday)
  const firstDayOfWeek = start.getDay()

  // Calculate empty cells before first day
  const emptyCells = Array(firstDayOfWeek).fill(null)

  // Get stats for the month
  const totalDistance = activities.reduce((sum, a) => sum + (a.distance || 0), 0)
  const totalTime = activities.reduce((sum, a) => sum + (a.movingTime || 0), 0)
  const totalActivities = activities.length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Training Calendar</h1>
          <p className="text-slate-600">Track your workouts and training schedule</p>
        </div>
      </div>

      {/* Month Stats - Compact */}
      <div className="grid gap-2 grid-cols-3">
        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardDescription className="text-xs">This Month</CardDescription>
            <CardTitle className="text-xl">{totalActivities}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardDescription className="text-xs">Total Distance</CardDescription>
            <CardTitle className="text-xl">{formatDistance(totalDistance)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardDescription className="text-xs">Total Time</CardDescription>
            <CardTitle className="text-xl">{formatTime(totalTime)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => navigateToMonth('prev')}
                  disabled={isSelectMode}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => navigateToMonth('next')}
                  disabled={isSelectMode}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <CardTitle className="text-lg">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {format(currentDate, 'MMMM yyyy')}
                  </div>
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {isSelectMode
                    ? `${selectedDates.size} day(s) selected`
                    : 'Click a date to add a workout'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSelectMode ? (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={selectedDates.size === 0 || isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete {selectedDates.size > 0 ? `(${selectedDates.size})` : ''}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectMode}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectMode}
                  >
                    <CheckSquare className="h-4 w-4 mr-1" />
                    Select
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDate(new Date())
                      setIsDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Workout
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          {/* Calendar Grid - Compact */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-slate-600 py-1"
              >
                {day}
              </div>
            ))}

            {/* Empty cells before first day */}
            {emptyCells.map((_, index) => (
              <div key={`empty-${index}`} className="h-16" />
            ))}

            {/* Calendar days */}
            {daysInMonth.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const dayActivities = activitiesByDate[dateKey] || []
              const dayWorkouts = workoutsByDate[dateKey] || []
              const hasActivities = dayActivities.length > 0
              const hasWorkouts = dayWorkouts.length > 0
              const today = isToday(day)
              const isSelected = selectedDates.has(dateKey)

              const totalItems = dayActivities.length + dayWorkouts.length
              const hasMore = totalItems > 2

              return (
                <div
                  key={dateKey}
                  onClick={(e) => {
                    if (isSelectMode) {
                      handleDateClickInSelectMode(day, e)
                    } else {
                      handleDateClick(day)
                    }
                  }}
                  className={`
                    relative h-16 border rounded-md p-1 text-xs
                    ${today ? 'border-primary border-2 bg-primary/5' : 'border-slate-200'}
                    ${isSelected ? 'border-blue-500 border-2 bg-blue-50' : ''}
                    ${!isSelected && (hasActivities || hasWorkouts) ? 'bg-green-50 hover:bg-green-100' : ''}
                    ${!isSelected && !hasActivities && !hasWorkouts ? 'hover:bg-slate-50' : ''}
                    ${isSelectMode && hasWorkouts ? 'cursor-pointer' : isSelectMode ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                    transition-colors
                  `}
                >
                  {/* Selection checkbox in top-left corner (select mode only) */}
                  {isSelectMode && hasWorkouts && (
                    <div className="absolute top-1 left-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Day number */}
                  <div className={`text-xs font-medium text-slate-700 mb-0.5 ${isSelectMode && hasWorkouts ? 'ml-5' : ''}`}>
                    {format(day, 'd')}
                  </div>

                  {/* +X indicator in top-right corner */}
                  {hasMore && !isSelectMode && (
                    <div className="absolute top-1 right-1 text-[10px] font-medium text-slate-600 bg-white/80 rounded px-1">
                      +{totalItems - 2}
                    </div>
                  )}

                  {/* Workout count in select mode */}
                  {isSelectMode && hasWorkouts && (
                    <Badge variant="secondary" className="absolute top-1 right-1 text-[10px] h-5">
                      {dayWorkouts.length}
                    </Badge>
                  )}

                  {/* Activities and workouts */}
                  <div className="space-y-0.5 overflow-hidden">
                    {/* Show planned workouts first */}
                    {dayWorkouts.slice(0, 1).map((workout) => (
                      <div
                        key={workout.id}
                        className="text-[10px] truncate px-1 py-0.5 bg-blue-100 text-blue-700 rounded"
                        title={workout.name || workout.type}
                      >
                        📅 {workout.type}
                      </div>
                    ))}
                    {/* Show activities */}
                    {dayActivities.slice(0, 1).map((activity) => (
                      <div
                        key={activity.id}
                        className="text-[10px] truncate"
                        title={activity.name}
                      >
                        <span className="mr-0.5">{getActivityIcon(activity.type)}</span>
                        <span className="text-slate-600">
                          {formatDistance(activity.distance)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <DateDetailsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedDate={selectedDate}
        activities={activities}
        plannedWorkouts={plannedWorkouts}
        onWorkoutDeleted={handleWorkoutDeleted}
        onWorkoutAdded={handleWorkoutAdded}
      />
    </div>
  )
}

