'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Calendar, Target, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface StrengthPlanOnboardingProps {
  userId: string
  onBack: () => void
  onPlanCreated?: () => void
}

type Step = 'goal' | 'experience' | 'schedule' | 'review'

type StrengthGoal = 'muscle-building' | 'strength-gain' | 'general-fitness' | 'weight-loss' | 'athletic-performance'
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
type SplitType = 'full-body' | 'upper-lower' | 'push-pull-legs' | 'body-part-split'

interface PlanConfig {
  goal: StrengthGoal | null
  experienceLevel: ExperienceLevel | null
  splitType: SplitType | null
  daysPerWeek: string
  sessionDuration: string
  startDate: string
  equipment: string[]
}

export function StrengthPlanOnboarding({ userId, onBack, onPlanCreated }: StrengthPlanOnboardingProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('goal')
  const [isGenerating, setIsGenerating] = useState(false)
  const [config, setConfig] = useState<PlanConfig>({
    goal: null,
    experienceLevel: null,
    splitType: null,
    daysPerWeek: '3',
    sessionDuration: '60',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    equipment: [],
  })

  const goalOptions = [
    { value: 'muscle-building' as const, label: 'Muscle Building', description: 'Hypertrophy-focused training for size' },
    { value: 'strength-gain' as const, label: 'Strength Gain', description: 'Build maximum strength and power' },
    { value: 'general-fitness' as const, label: 'General Fitness', description: 'Overall health and conditioning' },
    { value: 'weight-loss' as const, label: 'Weight Loss', description: 'Fat loss with muscle preservation' },
    { value: 'athletic-performance' as const, label: 'Athletic Performance', description: 'Sport-specific strength and power' },
  ]

  const experienceLevels = [
    { value: 'beginner' as const, label: 'Beginner', description: 'New to strength training or less than 6 months' },
    { value: 'intermediate' as const, label: 'Intermediate', description: '6 months to 2 years of consistent training' },
    { value: 'advanced' as const, label: 'Advanced', description: '2+ years of structured training' },
  ]

  const splitOptions = [
    { value: 'full-body' as const, label: 'Full Body', description: 'Train all muscle groups each session', days: '2-3' },
    { value: 'upper-lower' as const, label: 'Upper/Lower Split', description: 'Alternate between upper and lower body', days: '4' },
    { value: 'push-pull-legs' as const, label: 'Push/Pull/Legs', description: 'Pushing, pulling, and leg movements', days: '3-6' },
    { value: 'body-part-split' as const, label: 'Body Part Split', description: 'Focus on specific muscle groups each day', days: '4-6' },
  ]

  const equipmentOptions = [
    'Barbell',
    'Dumbbells',
    'Resistance Bands',
    'Pull-up Bar',
    'Bench',
    'Squat Rack',
    'Cable Machine',
    'Bodyweight Only',
  ]

  const toggleEquipment = (equipment: string) => {
    setConfig((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter((e) => e !== equipment)
        : [...prev.equipment, equipment],
    }))
  }

  const handleGeneratePlan = async () => {
    setIsGenerating(true)
    try {
      console.log('Generating plan with config:', config)

      const response = await fetch('/api/training-plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          planType: 'strength',
          config,
        }),
      })

      const data = await response.json()
      console.log('API response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate plan')
      }

      // Call the onPlanCreated callback
      if (onPlanCreated) {
        onPlanCreated()
      } else {
        // Redirect to calendar to see the newly generated plan
        router.push('/dashboard/calendar')
      }
    } catch (error) {
      console.error('Error generating plan:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate training plan'
      alert(`Error: ${errorMessage}\n\nCheck the browser console for more details.`)
    } finally {
      setIsGenerating(false)
    }
  }

  const canProceedFromGoal = config.goal !== null
  const canProceedFromExperience = config.experienceLevel !== null && config.splitType !== null && config.equipment.length > 0
  const canProceedFromSchedule = config.daysPerWeek && config.sessionDuration && config.startDate

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Create Strength Plan</h1>
          <p className="text-slate-600">Answer a few questions to build your personalized training plan</p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div className={`h-2 flex-1 rounded-full ${step === 'goal' || step === 'experience' || step === 'schedule' || step === 'review' ? 'bg-primary' : 'bg-slate-200'}`} />
        <div className={`h-2 flex-1 rounded-full ${step === 'experience' || step === 'schedule' || step === 'review' ? 'bg-primary' : 'bg-slate-200'}`} />
        <div className={`h-2 flex-1 rounded-full ${step === 'schedule' || step === 'review' ? 'bg-primary' : 'bg-slate-200'}`} />
        <div className={`h-2 flex-1 rounded-full ${step === 'review' ? 'bg-primary' : 'bg-slate-200'}`} />
      </div>

      {/* Step 1: Goal Selection */}
      {step === 'goal' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>What's Your Goal?</CardTitle>
            </div>
            <CardDescription>Choose your primary training objective</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {goalOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => setConfig({ ...config, goal: option.value })}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  config.goal === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-medium text-slate-900">{option.label}</p>
                <p className="text-sm text-slate-600">{option.description}</p>
              </div>
            ))}
            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep('experience')} disabled={!canProceedFromGoal}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Experience Level & Split */}
      {step === 'experience' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Training Experience</CardTitle>
            </div>
            <CardDescription>Tell us about your strength training background</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Experience Level</Label>
              {experienceLevels.map((level) => (
                <div
                  key={level.value}
                  onClick={() => setConfig({ ...config, experienceLevel: level.value })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    config.experienceLevel === level.value
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-medium text-slate-900">{level.label}</p>
                  <p className="text-sm text-slate-600">{level.description}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Label>Training Split</Label>
              {splitOptions.map((split) => (
                <div
                  key={split.value}
                  onClick={() => setConfig({ ...config, splitType: split.value })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    config.splitType === split.value
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{split.label}</p>
                      <p className="text-sm text-slate-600">{split.description}</p>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                      {split.days} days
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Label>Available Equipment</Label>
              <p className="text-sm text-slate-500 mb-2">Select all that apply</p>
              <div className="grid grid-cols-2 gap-2">
                {equipmentOptions.map((equipment) => (
                  <div
                    key={equipment}
                    onClick={() => toggleEquipment(equipment)}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all text-sm ${
                      config.equipment.includes(equipment)
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {equipment}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('goal')}>
                Back
              </Button>
              <Button onClick={() => setStep('schedule')} disabled={!canProceedFromExperience}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Schedule */}
      {step === 'schedule' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Training Schedule</CardTitle>
            </div>
            <CardDescription>Set your training frequency and duration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="daysPerWeek">Training Days Per Week</Label>
              <select
                id="daysPerWeek"
                value={config.daysPerWeek}
                onChange={(e) => setConfig({ ...config, daysPerWeek: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="2">2 days per week</option>
                <option value="3">3 days per week</option>
                <option value="4">4 days per week</option>
                <option value="5">5 days per week</option>
                <option value="6">6 days per week</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionDuration">Session Duration (minutes)</Label>
              <select
                id="sessionDuration"
                value={config.sessionDuration}
                onChange={(e) => setConfig({ ...config, sessionDuration: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="75">75 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={config.startDate}
                onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('experience')}>
                Back
              </Button>
              <Button onClick={() => setStep('review')} disabled={!canProceedFromSchedule}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Generate */}
      {step === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle>Review Your Plan</CardTitle>
            <CardDescription>Check your settings before generating your training plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-600">Goal</p>
                  <p className="text-base text-slate-900">
                    {goalOptions.find((g) => g.value === config.goal)?.label}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep('goal')}>
                  Edit
                </Button>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-600">Experience & Split</p>
                  <p className="text-base text-slate-900">
                    {experienceLevels.find((l) => l.value === config.experienceLevel)?.label}
                  </p>
                  <p className="text-sm text-slate-600">
                    {splitOptions.find((s) => s.value === config.splitType)?.label}
                  </p>
                  <p className="text-sm text-slate-600">
                    Equipment: {config.equipment.join(', ')}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep('experience')}>
                  Edit
                </Button>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-600">Schedule</p>
                  <p className="text-base text-slate-900">
                    {config.daysPerWeek} days per week
                  </p>
                  <p className="text-sm text-slate-600">
                    {config.sessionDuration} minutes per session
                  </p>
                  <p className="text-sm text-slate-600">
                    Starting {format(new Date(config.startDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep('schedule')}>
                  Edit
                </Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-slate-600 mb-4">
                Your personalized training plan will be generated and added to your Training Calendar.
                You can modify individual workouts as needed.
              </p>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('schedule')}>
                  Back
                </Button>
                <Button onClick={handleGeneratePlan} disabled={isGenerating}>
                  {isGenerating ? 'Generating...' : 'Generate Training Plan'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
