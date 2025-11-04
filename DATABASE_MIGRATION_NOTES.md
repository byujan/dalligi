# Database Migration Notes

## Training Plans Feature

The training plans feature requires the following database schema additions:

### New Table: `training_plans`

```sql
CREATE TABLE training_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'running' or 'strength'
  goal TEXT NOT NULL, -- e.g., '5k', 'marathon', 'muscle-building', etc.
  experience_level TEXT NOT NULL, -- 'beginner', 'intermediate', 'advanced'
  config JSONB, -- Stores the full plan configuration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_training_plans_user_id ON training_plans(user_id);
```

### Update Table: `planned_workouts`

```sql
-- Add training_plan_id column to planned_workouts
ALTER TABLE planned_workouts
ADD COLUMN training_plan_id UUID REFERENCES training_plans(id) ON DELETE CASCADE;

-- Add index for faster queries
CREATE INDEX idx_planned_workouts_training_plan_id ON planned_workouts(training_plan_id);
```

### Migration Steps

1. Create the `training_plans` table
2. Add the `training_plan_id` column to `planned_workouts`
3. Existing workouts will have `training_plan_id` as NULL (manually created workouts)
4. New workouts created through training plans will have a `training_plan_id`

### Features Enabled

- Track multiple training plans per user
- Associate workouts with specific training plans
- Delete entire training plans (cascade deletes all workouts)
- View plan metadata (goal, experience level, dates, workout count)
- Navigate to calendar to view plan workouts
