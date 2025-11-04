'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Calendar, TrendingUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useRouter } from 'next/navigation'

interface TrainingPlan {
  id: string
  name: string
  type: string
  goal: string
  experience_level: string
  created_at: string
  workoutCount: number
  startDate: string | null
  endDate: string | null
}

interface ActiveTrainingPlansProps {
  userId: string
  refreshKey?: number
}

export function ActiveTrainingPlans({ userId, refreshKey = 0 }: ActiveTrainingPlansProps) {
  const router = useRouter()
  const [plans, setPlans] = useState<TrainingPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null)

  useEffect(() => {
    fetchPlans()
  }, [refreshKey])

  const fetchPlans = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/training-plans')

      if (!response.ok) {
        const data = await response.json()
        console.error('API Error:', data)

        // If the table doesn't exist, just show no plans
        if (data.error?.includes('relation') || data.error?.includes('does not exist')) {
          setPlans([])
          return
        }

        throw new Error(data.error || 'Failed to fetch plans')
      }

      const data = await response.json()
      console.log('Fetched plans:', data)
      setPlans(data.plans || [])
    } catch (err) {
      console.error('Error fetching plans:', err)
      setError(err instanceof Error ? err.message : 'Failed to load training plans')
      setPlans([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this training plan? All associated workouts will be removed from your calendar.')) {
      return
    }

    setDeletingPlanId(planId)
    try {
      const response = await fetch(`/api/training-plans?id=${planId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete plan')

      // Refresh the plans list
      await fetchPlans()
    } catch (error) {
      console.error('Error deleting plan:', error)
      alert('Failed to delete training plan. Please try again.')
    } finally {
      setDeletingPlanId(null)
    }
  }

  const handleViewInCalendar = (plan: TrainingPlan) => {
    if (plan.startDate) {
      const date = parseISO(plan.startDate)
      const month = date.getMonth() + 1
      const year = date.getFullYear()
      router.push(`/dashboard/calendar?month=${month}&year=${year}`)
    } else {
      router.push('/dashboard/calendar')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Training Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Loading your plans...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Training Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Error loading plans: {error}</p>
          <Button variant="outline" size="sm" onClick={fetchPlans} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (plans.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Training Plans</CardTitle>
        <CardDescription>Active training programs added to your calendar</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {plan.type === 'running' ? '🏃 Running' : '💪 Strength'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">
                    {plan.experience_level.charAt(0).toUpperCase() + plan.experience_level.slice(1)} level • {plan.workoutCount} workouts
                  </p>
                  {plan.startDate && plan.endDate && (
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(plan.startDate), 'MMM d')} - {format(parseISO(plan.endDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewInCalendar(plan)}
                  >
                    View in Calendar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePlan(plan.id)}
                    disabled={deletingPlanId === plan.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
