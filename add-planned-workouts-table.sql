-- Create planned_workouts table for manually scheduled workouts
-- Run this in your Supabase SQL editor

CREATE TYPE workout_type AS ENUM (
  'Run', 'Ride', 'Swim', 'Walk', 'Hike', 'VirtualRide',
  'VirtualRun', 'Workout', 'Yoga', 'Strength', 'Rest'
);

CREATE TABLE IF NOT EXISTS public.planned_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type workout_type NOT NULL,
  name TEXT,
  description TEXT,
  duration INTEGER, -- minutes
  distance NUMERIC(10, 2), -- meters (optional)
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date, name)
);

CREATE INDEX IF NOT EXISTS idx_planned_workouts_user_id ON public.planned_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_planned_workouts_date ON public.planned_workouts(date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_planned_workout_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER planned_workout_updated_at
  BEFORE UPDATE ON public.planned_workouts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_planned_workout_updated_at();

