-- Fix Unique Constraint on Planned Workouts
-- Run this in your Supabase SQL Editor

-- This constraint prevents multiple workouts with the same name on the same day
-- We need to drop it so users can have multiple workouts per day

-- Drop the unique constraint
ALTER TABLE planned_workouts
DROP CONSTRAINT IF EXISTS planned_workouts_user_id_date_name_key;

-- Done! Try generating a training plan again.
-- Users can now have multiple workouts on the same day, even with the same name.
