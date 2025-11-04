-- Migration for Training Plans Feature
-- Run this in your Supabase SQL editor

-- 1. Create training_plans table
CREATE TABLE IF NOT EXISTS training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('running', 'strength')),
  goal TEXT NOT NULL,
  experience_level TEXT NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_plans_user_id ON training_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_created_at ON training_plans(created_at DESC);

-- 3. Add training_plan_id column to existing planned_workouts table
-- First check if the column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'planned_workouts'
    AND column_name = 'training_plan_id'
  ) THEN
    ALTER TABLE planned_workouts
    ADD COLUMN training_plan_id UUID REFERENCES training_plans(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Add indexes for planned_workouts
CREATE INDEX IF NOT EXISTS idx_planned_workouts_user_id ON planned_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_planned_workouts_date ON planned_workouts(date);
CREATE INDEX IF NOT EXISTS idx_planned_workouts_training_plan_id ON planned_workouts(training_plan_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_workouts ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own training plans" ON training_plans;
DROP POLICY IF EXISTS "Users can create their own training plans" ON training_plans;
DROP POLICY IF EXISTS "Users can update their own training plans" ON training_plans;
DROP POLICY IF EXISTS "Users can delete their own training plans" ON training_plans;

-- 7. Create RLS policies for training_plans
CREATE POLICY "Users can view their own training plans"
  ON training_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own training plans"
  ON training_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training plans"
  ON training_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own training plans"
  ON training_plans FOR DELETE
  USING (auth.uid() = user_id);

-- 8. RLS policies for planned_workouts may already exist, so we don't need to recreate them
-- The existing policies should work fine with the new training_plan_id column

-- 9. Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for training_plans updated_at
DROP TRIGGER IF EXISTS training_plans_updated_at ON training_plans;
CREATE TRIGGER training_plans_updated_at
  BEFORE UPDATE ON training_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Done! Your database is now ready for the training plans feature.
--
-- To verify the tables were created successfully, run:
-- SELECT * FROM training_plans;
-- SELECT * FROM planned_workouts;
