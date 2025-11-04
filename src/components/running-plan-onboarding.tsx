'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Calendar, Target, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format, addWeeks } from 'date-fns'

interface RunningPlanOnboardingProps {
  userId: string
  onBack: () => void
  onPlanCreated?: () => void
}

type Step = 'goal' | 'experience' | 'schedule' | 'review'

type RunGoal = '5k' | '10k' | 'half-marathon' | 'marathon' | 'general-fitness'
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

interface PlanConfig {
  goal: RunGoal | null
  experienceLevel: ExperienceLevel | null
  currentWeeklyMileage: string
  daysPerWeek: string
  startDate: string
  raceDate: string
}

export function RunningPlanOnboarding({ userId, onBack, onPlanCreated }: RunningPlanOnboardingProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('goal')
  const [isGenerating, setIsGenerating] = useState(false)
  const [config, setConfig] = useState<PlanConfig>({
    goal: null,
    experienceLevel: null,
    currentWeeklyMileage: '',
    daysPerWeek: '4',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    raceDate: format(addWeeks(new Date(), 12), 'yyyy-MM-dd'),
  })

  const goalOptions = [
    { value: '5k' as const, label: '5K Race', description: 'Complete a 5K (3.1 miles)', weeks: 8 },
    { value: '10k' as const, label: '10K Race', description: 'Complete a 10K (6.2 miles)', weeks: 10 },
    { value: 'half-marathon' as const, label: 'Half Marathon', description: 'Complete a half marathon (13.1 miles)', weeks: 12 },
    { value: 'marathon' as const, label: 'Marathon', description: 'Complete a marathon (26.2 miles)', weeks: 16 },
    { value: 'general-fitness' as const, label: 'General Fitness', description: 'Improve running fitness', weeks: 8 },
  ]

  const experienceLevels = [
    { value: 'beginner' as const, label: 'Beginner', description: 'New to running or returning after a break' },
    { value: 'intermediate' as const, label: 'Intermediate', description: 'Run regularly, comfortable with 5K+' },
    { value: 'advanced' as const, label: 'Advanced', description: 'Experienced runner with race history' },
  ]

  const handleGeneratePlan = async () => {
    setIsGenerating(true)
    try {
      console.log('Generating plan with config:', config)

      const response = await fetch('/api/training-plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          planType: 'running',
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
  const canProceedFromExperience = config.experienceLevel !== null && config.currentWeeklyMileage
  const canProceedFromSchedule = config.daysPerWeek && config.startDate

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Create Running Plan</h1>
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
            <CardDescription>Choose the race distance or training focus</CardDescription>
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
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{option.label}</p>
                    <p className="text-sm text-slate-600">{option.description}</p>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                    ~{option.weeks} weeks
                  </span>
                </div>
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

      {/* Step 2: Experience Level */}
      {step === 'experience' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Experience Level</CardTitle>
            </div>
            <CardDescription>Tell us about your running background</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
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

            <div className="space-y-2">
              <Label htmlFor="weeklyMileage">Current Weekly Mileage (miles)</Label>
              <Input
                id="weeklyMileage"
                type="number"
                placeholder="e.g., 15"
                value={config.currentWeeklyMileage}
                onChange={(e) => setConfig({ ...config, currentWeeklyMileage: e.target.value })}
              />
              <p className="text-xs text-slate-500">
                Enter your average weekly running distance over the past month
              </p>
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
            <CardDescription>Set your training timeline and availability</CardDescription>
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
                <option value="3">3 days per week</option>
                <option value="4">4 days per week</option>
                <option value="5">5 days per week</option>
                <option value="6">6 days per week</option>
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

            {config.goal !== 'general-fitness' && (
              <div className="space-y-2">
                <Label htmlFor="raceDate">Target Race Date (Optional)</Label>
                <Input
                  id="raceDate"
                  type="date"
                  value={config.raceDate}
                  onChange={(e) => setConfig({ ...config, raceDate: e.target.value })}
                />
                <p className="text-xs text-slate-500">
                  Your plan will be tailored to peak on this date
                </p>
              </div>
            )}

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
                  <p className="text-sm font-medium text-slate-600">Experience Level</p>
                  <p className="text-base text-slate-900">
                    {experienceLevels.find((l) => l.value === config.experienceLevel)?.label}
                  </p>
                  <p className="text-sm text-slate-600">
                    Current weekly mileage: {config.currentWeeklyMileage} miles
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep('experience')}>
                  Edit
                </Button>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-600">Schedule</p>
                  <p className="text-base text-slate-900">{config.daysPerWeek} days per week</p>
                  <p className="text-sm text-slate-600">
                    Starting {format(new Date(config.startDate), 'MMM d, yyyy')}
                  </p>
                  {config.goal !== 'general-fitness' && config.raceDate && (
                    <p className="text-sm text-slate-600">
                      Race day: {format(new Date(config.raceDate), 'MMM d, yyyy')}
                    </p>
                  )}
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
