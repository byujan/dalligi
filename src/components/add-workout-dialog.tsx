'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFormattedUnits } from '@/hooks/use-formatted-units'

// const WORKOUT_TYPES = [
//   'Run',
//   'Ride',
//   'Swim',
//   'Walk',
//   'Hike',
//   'VirtualRide',
//   'VirtualRun',
//   'Workout',
//   'Yoga',
//   'Strength',
//   'Rest',
// ] as const

const WORKOUT_TYPES = [
  'Run',
  'Strength',
] as const

interface AddWorkoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date | null
  onSuccess: () => void
}

export function AddWorkoutDialog({
  open,
  onOpenChange,
  selectedDate,
  onSuccess,
}: AddWorkoutDialogProps) {
  const { units } = useFormattedUnits()
  const [type, setType] = useState<typeof WORKOUT_TYPES[number]>('Run')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate) return

    setLoading(true)
    setError(null)

    try {
      const dateStr = selectedDate.toISOString().split('T')[0]

      // Convert distance to meters (if input is in miles, convert to meters; if km, convert to meters)
      let distanceMeters: number | null = null
      if (distance) {
        const distanceValue = parseFloat(distance)
        if (units === 'imperial') {
          distanceMeters = distanceValue * 1609.34 // miles to meters
        } else {
          distanceMeters = distanceValue * 1000 // km to meters
        }
      }

      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          type,
          name: name || null,
          description: description || null,
          duration: duration ? parseInt(duration) : null,
          distance: distanceMeters,
          notes: notes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create workout')
      }

      // Reset form
      setName('')
      setDescription('')
      setDuration('')
      setDistance('')
      setNotes('')
      setType('Run')

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Workout</DialogTitle>
          <DialogDescription>
            {selectedDate
              ? `Schedule a workout for ${selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}`
              : 'Select a date first'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="type">Workout Type *</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as typeof WORKOUT_TYPES[number])}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                {WORKOUT_TYPES.map((wt) => (
                  <option key={wt} value={wt}>
                    {wt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="name">Workout Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Long Run, Interval Training"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="60"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="distance">Distance ({units === 'imperial' ? 'mi' : 'km'})</Label>
                <Input
                  id="distance"
                  type="number"
                  step="0.1"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder={units === 'imperial' ? '3.1' : '5.0'}
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or instructions"
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                rows={3}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedDate}>
              {loading ? 'Adding...' : 'Add Workout'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

