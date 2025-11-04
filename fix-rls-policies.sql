-- Fix RLS Policies for Training Plans
-- Run this in your Supabase SQL Editor

-- 1. Drop existing policies for planned_workouts
DROP POLICY IF EXISTS "Users can view their own planned workouts" ON planned_workouts;
DROP POLICY IF EXISTS "Users can create their own planned workouts" ON planned_workouts;
DROP POLICY IF EXISTS "Users can update their own planned workouts" ON planned_workouts;
DROP POLICY IF EXISTS "Users can delete their own planned workouts" ON planned_workouts;

-- 2. Recreate policies with correct permissions
CREATE POLICY "Users can view their own planned workouts"
  ON planned_workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own planned workouts"
  ON planned_workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planned workouts"
  ON planned_workouts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planned workouts"
  ON planned_workouts FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Verify RLS is enabled
ALTER TABLE planned_workouts ENABLE ROW LEVEL SECURITY;

-- Done! Try generating a training plan again.
