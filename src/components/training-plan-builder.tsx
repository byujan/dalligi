'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RunningPlanOnboarding } from '@/components/running-plan-onboarding'
import { StrengthPlanOnboarding } from '@/components/strength-plan-onboarding'
import { ActiveTrainingPlans } from '@/components/active-training-plans'
import { Dumbbell, Clock } from 'lucide-react'

interface TrainingPlanBuilderProps {
  userId: string
}

type PlanType = 'running' | 'strength' | null

export function TrainingPlanBuilder({ userId }: TrainingPlanBuilderProps) {
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handlePlanCreated = () => {
    setRefreshKey((prev) => prev + 1)
    setSelectedPlanType(null)
  }

  if (selectedPlanType === 'running') {
    return (
      <RunningPlanOnboarding
        userId={userId}
        onBack={() => setSelectedPlanType(null)}
        onPlanCreated={handlePlanCreated}
      />
    )
  }

  if (selectedPlanType === 'strength') {
    return (
      <StrengthPlanOnboarding
        userId={userId}
        onBack={() => setSelectedPlanType(null)}
        onPlanCreated={handlePlanCreated}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Training Plan</h1>
        <p className="text-slate-600">
          Build a structured training program to achieve your goals
        </p>
      </div>

      {/* Active Training Plans */}
      <ActiveTrainingPlans userId={userId} refreshKey={refreshKey} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary" onClick={() => setSelectedPlanType('running')}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-blue-100">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Running Plan</CardTitle>
            </div>
            <CardDescription>
              Structured programs for 5K, 10K, half marathon, and marathon training
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-600 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Progressive mileage building</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Speed work and tempo runs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Recovery and rest days</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Race-day preparation</span>
              </li>
            </ul>
            <Button className="w-full" size="lg">
              Create Running Plan
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary" onClick={() => setSelectedPlanType('strength')}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-orange-100">
                <Dumbbell className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-xl">Strength Plan</CardTitle>
            </div>
            <CardDescription>
              Build muscle, increase strength, and improve overall fitness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-600 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Progressive overload training</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Full-body and split routines</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Compound and isolation exercises</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Deload and recovery weeks</span>
              </li>
            </ul>
            <Button className="w-full" size="lg">
              Create Strength Plan
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Training Plans Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              <strong className="text-slate-900">1. Choose Your Plan:</strong> Select between running or strength training based on your goals
            </p>
            <p>
              <strong className="text-slate-900">2. Set Your Parameters:</strong> Tell us about your experience level, goals, and schedule
            </p>
            <p>
              <strong className="text-slate-900">3. Generate Your Schedule:</strong> We'll create a personalized training plan
            </p>
            <p>
              <strong className="text-slate-900">4. Sync to Calendar:</strong> Your workouts will automatically appear in your Training Calendar
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
