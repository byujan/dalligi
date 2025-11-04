import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { format, addDays, addWeeks, parseISO } from 'date-fns'

interface RunningConfig {
  goal: '5k' | '10k' | 'half-marathon' | 'marathon' | 'general-fitness'
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  currentWeeklyMileage: string
  daysPerWeek: string
  startDate: string
  raceDate: string
}

interface StrengthConfig {
  goal: 'muscle-building' | 'strength-gain' | 'general-fitness' | 'weight-loss' | 'athletic-performance'
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  splitType: 'full-body' | 'upper-lower' | 'push-pull-legs' | 'body-part-split'
  daysPerWeek: string
  sessionDuration: string
  startDate: string
  equipment: string[]
}

function generateRunningPlan(config: RunningConfig) {
  const daysPerWeek = parseInt(config.daysPerWeek)
  const startDate = parseISO(config.startDate)
  const workouts: Array<{ date: string; type: string; name: string; description: string; duration: number | null; distance: number | null }> = []

  // Determine plan duration based on goal
  const planDurationWeeks = {
    '5k': 8,
    '10k': 10,
    'half-marathon': 12,
    'marathon': 16,
    'general-fitness': 8,
  }[config.goal]

  const baseWeeklyMileage = parseFloat(config.currentWeeklyMileage) || 10

  // Generate workouts for each week
  for (let week = 0; week < planDurationWeeks; week++) {
    const weekMultiplier = 1 + (week * 0.1) // Gradually increase by 10% per week
    const isRecoveryWeek = (week + 1) % 4 === 0 // Every 4th week is recovery
    const weekMileage = isRecoveryWeek ? baseWeeklyMileage * 0.7 : baseWeeklyMileage * weekMultiplier

    // Schedule workouts based on days per week
    const workoutTypes = ['Easy Run', 'Tempo Run', 'Long Run', 'Interval Training', 'Recovery Run']

    for (let day = 0; day < daysPerWeek; day++) {
      const workoutDate = addWeeks(addDays(startDate, day * Math.floor(7 / daysPerWeek)), week)
      let workoutType = workoutTypes[day % workoutTypes.length]
      let distance = weekMileage / daysPerWeek
      let description = ''

      // Customize workout based on type
      if (workoutType === 'Long Run') {
        distance = weekMileage * 0.35 // Long run is 35% of weekly mileage
        description = 'Build endurance with a comfortable pace. Stay hydrated.'
      } else if (workoutType === 'Tempo Run') {
        distance = weekMileage * 0.2
        description = 'Run at comfortably hard pace. Should feel challenging but sustainable.'
      } else if (workoutType === 'Interval Training') {
        distance = weekMileage * 0.15
        description = 'High intensity intervals with rest periods. Warm up and cool down properly.'
      } else if (workoutType === 'Recovery Run') {
        distance = weekMileage * 0.15
        description = 'Very easy pace for active recovery. Focus on form and breathing.'
      } else {
        description = 'Comfortable, conversational pace. Build your aerobic base.'
      }

      // Adjust for experience level
      if (config.experienceLevel === 'beginner') {
        distance *= 0.8
        workoutType = day === 0 ? 'Easy Run' : workoutType // Beginners start with easy runs
      } else if (config.experienceLevel === 'advanced') {
        distance *= 1.2
      }

      workouts.push({
        date: format(workoutDate, 'yyyy-MM-dd'),
        type: 'Run',
        name: workoutType,
        description,
        duration: null,
        distance: Math.round(distance * 1609.34), // Convert miles to meters
      })
    }
  }

  return workouts
}

function generateStrengthPlan(config: StrengthConfig) {
  const daysPerWeek = parseInt(config.daysPerWeek)
  const sessionDuration = parseInt(config.sessionDuration)
  const startDate = parseISO(config.startDate)
  const workouts: Array<{ date: string; type: string; name: string; description: string; duration: number | null; distance: number | null }> = []

  // Determine workout split pattern
  let splitPattern: string[] = []

  if (config.splitType === 'full-body') {
    splitPattern = ['Full Body']
  } else if (config.splitType === 'upper-lower') {
    splitPattern = ['Upper Body', 'Lower Body']
  } else if (config.splitType === 'push-pull-legs') {
    splitPattern = ['Push', 'Pull', 'Legs']
  } else {
    splitPattern = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms']
  }

  // Generate 8 weeks of training
  const planDurationWeeks = 8

  for (let week = 0; week < planDurationWeeks; week++) {
    const isDeloadWeek = (week + 1) % 4 === 0 // Every 4th week is deload

    for (let day = 0; day < daysPerWeek; day++) {
      const workoutDate = addWeeks(addDays(startDate, day * Math.floor(7 / daysPerWeek)), week)
      const workoutType = splitPattern[day % splitPattern.length]

      let description = generateStrengthWorkoutDescription(workoutType, config.goal, config.experienceLevel, isDeloadWeek)
      let name = isDeloadWeek ? `${workoutType} (Deload)` : workoutType

      workouts.push({
        date: format(workoutDate, 'yyyy-MM-dd'),
        type: 'WeightTraining',
        name,
        description,
        duration: sessionDuration * 60, // Convert to seconds
        distance: null,
      })
    }
  }

  return workouts
}

function generateStrengthWorkoutDescription(
  workoutType: string,
  goal: string,
  experienceLevel: string,
  isDeloadWeek: boolean
): string {
  const exercises: Record<string, string[]> = {
    'Full Body': [
      'Squats',
      'Bench Press',
      'Deadlifts',
      'Rows',
      'Overhead Press',
      'Pull-ups',
    ],
    'Upper Body': [
      'Bench Press',
      'Rows',
      'Overhead Press',
      'Pull-ups',
      'Dips',
      'Curls',
    ],
    'Lower Body': [
      'Squats',
      'Deadlifts',
      'Lunges',
      'Leg Press',
      'Leg Curls',
      'Calf Raises',
    ],
    'Push': [
      'Bench Press',
      'Overhead Press',
      'Incline Press',
      'Dips',
      'Lateral Raises',
      'Tricep Extensions',
    ],
    'Pull': [
      'Deadlifts',
      'Pull-ups',
      'Rows',
      'Face Pulls',
      'Bicep Curls',
      'Shrugs',
    ],
    'Legs': [
      'Squats',
      'Romanian Deadlifts',
      'Lunges',
      'Leg Press',
      'Leg Curls',
      'Calf Raises',
    ],
    'Chest': [
      'Bench Press',
      'Incline Press',
      'Dumbbell Flyes',
      'Cable Crossovers',
      'Push-ups',
    ],
    'Back': [
      'Deadlifts',
      'Pull-ups',
      'Barbell Rows',
      'Lat Pulldowns',
      'Cable Rows',
    ],
    'Shoulders': [
      'Overhead Press',
      'Lateral Raises',
      'Front Raises',
      'Face Pulls',
      'Upright Rows',
    ],
    'Arms': [
      'Barbell Curls',
      'Tricep Dips',
      'Hammer Curls',
      'Skull Crushers',
      'Cable Curls',
    ],
  }

  const exerciseList = exercises[workoutType] || exercises['Full Body']

  let sets = 3
  let reps = '8-12'

  if (goal === 'strength-gain') {
    sets = 5
    reps = '3-5'
  } else if (goal === 'muscle-building') {
    sets = 4
    reps = '8-12'
  } else if (goal === 'weight-loss') {
    sets = 3
    reps = '12-15'
  }

  if (experienceLevel === 'beginner') {
    sets = Math.max(2, sets - 1)
  } else if (experienceLevel === 'advanced') {
    sets += 1
  }

  if (isDeloadWeek) {
    sets = Math.max(2, Math.floor(sets * 0.6))
    reps = '8-10'
  }

  const exerciseDescriptions = exerciseList
    .slice(0, experienceLevel === 'beginner' ? 4 : 6)
    .map((ex) => `${ex}: ${sets} sets × ${reps} reps`)
    .join('\n')

  let notes = ''
  if (isDeloadWeek) {
    notes = '\n\nDeload week: Reduce weight by 40-50% and focus on form and recovery.'
  } else if (goal === 'muscle-building') {
    notes = '\n\nFocus on time under tension and muscle contraction. Rest 60-90 seconds between sets.'
  } else if (goal === 'strength-gain') {
    notes = '\n\nFocus on heavy weights and proper form. Rest 3-5 minutes between sets.'
  }

  return exerciseDescriptions + notes
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { planType, config } = body

    if (!planType || !config) {
      return NextResponse.json(
        { error: 'Plan type and configuration are required' },
        { status: 400 }
      )
    }

    let workouts: Array<{
      date: string
      type: string
      name: string
      description: string
      duration: number | null
      distance: number | null
    }> = []

    // Generate workouts based on plan type
    if (planType === 'running') {
      workouts = generateRunningPlan(config)
    } else if (planType === 'strength') {
      workouts = generateStrengthPlan(config)
    } else {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      )
    }

    // Insert workouts into the database
    const supabase = await createClient()

    // First, create the training plan record
    const planName = planType === 'running'
      ? `${config.goal.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Running Plan`
      : `${config.goal.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Strength Plan`

    const { data: planData, error: planError } = await supabase
      .from('training_plans')
      .insert({
        user_id: user.id,
        name: planName,
        type: planType,
        goal: config.goal,
        experience_level: config.experienceLevel,
        config: config,
      })
      .select()
      .single()

    if (planError) {
      console.error('Error creating training plan:', planError)
      console.error('Plan error details:', JSON.stringify(planError, null, 2))
      return NextResponse.json(
        { error: `Failed to create training plan: ${planError.message || JSON.stringify(planError)}` },
        { status: 500 }
      )
    }

    // Then insert workouts with the training plan ID
    const workoutsToInsert = workouts.map((workout) => ({
      user_id: user.id,
      training_plan_id: planData.id,
      date: workout.date,
      type: workout.type,
      name: workout.name,
      description: workout.description,
      duration: workout.duration,
      distance: workout.distance,
      notes: null,
    }))

    const { data, error } = await supabase
      .from('planned_workouts')
      .insert(workoutsToInsert)
      .select()

    if (error) {
      console.error('Error inserting workouts:', error)
      console.error('Workout error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: `Failed to insert workouts: ${error.message || JSON.stringify(error)}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      planId: planData.id,
      workoutCount: workouts.length,
      workouts: data,
    })
  } catch (error) {
    console.error('Error generating training plan:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate training plan',
      },
      { status: 500 }
    )
  }
}
