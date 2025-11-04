# Training Plans Feature Setup

The training plans feature has been fully implemented but requires a database migration to work properly.

## Quick Fix

The issue you're experiencing is that the database tables for training plans don't exist yet. Here's how to fix it:

### Step 1: Run the Migration

1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `training-plans-migration.sql`
6. Click **Run** or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)

### Step 2: Verify the Tables

After running the migration, verify that the tables were created:

```sql
-- Check if training_plans table exists
SELECT * FROM training_plans;

-- Check if planned_workouts table exists
SELECT * FROM planned_workouts;
```

Both queries should return empty results (no rows) if you haven't created any plans yet. If they return an error, the migration didn't run successfully.

## What This Migration Does

1. **Creates `training_plans` table** - Stores metadata about each training plan (name, type, goal, experience level)

2. **Creates or updates `planned_workouts` table** - Stores individual workouts with optional link to a training plan via `training_plan_id`

3. **Sets up Row Level Security (RLS)** - Ensures users can only see and modify their own plans and workouts

4. **Creates indexes** - Improves query performance for fetching plans and workouts

5. **Adds triggers** - Automatically updates the `updated_at` timestamp when records are modified

## After Migration

Once the migration is complete:

1. Refresh your browser on the Training Plan page
2. Create a new training plan (Running or Strength)
3. The plan will appear in the "Your Training Plans" section
4. All workouts from the plan will be visible in your Training Calendar
5. You can delete entire plans (which removes all associated workouts)
6. Navigate between months in the calendar using the arrow buttons

## Troubleshooting

### Error: "relation 'training_plans' does not exist"

This means the migration hasn't been run yet. Follow Step 1 above.

### Error: "relation 'profiles' does not exist"

Your database uses a different user table name. Update line 3 of the migration:

```sql
-- Change this:
user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

-- To this (if you use 'users'):
user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
```

### Plans Not Showing After Migration

1. Open browser console (F12)
2. Check for any errors in the Network tab
3. Look for the `/api/training-plans` request
4. Verify RLS policies are set up correctly in Supabase

### Still Having Issues?

Check the browser console for error messages and verify:
- You're logged in
- Your auth token is valid
- The RLS policies allow your user to access the tables

## Features Included

✅ Month navigation in Training Calendar (previous/next buttons)
✅ View all active training plans with details
✅ Delete entire training plans (removes all workouts)
✅ Running plan generator (5K, 10K, Half Marathon, Marathon, General Fitness)
✅ Strength plan generator (Multiple goals and training splits)
✅ Automatic integration with Training Calendar
✅ Plans track workout count and date ranges
✅ Navigate directly to calendar from a plan

## Database Schema

```
training_plans
├── id (UUID, primary key)
├── user_id (UUID, foreign key → profiles/users)
├── name (TEXT)
├── type ('running' | 'strength')
├── goal (TEXT)
├── experience_level ('beginner' | 'intermediate' | 'advanced')
├── config (JSONB)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

planned_workouts
├── id (UUID, primary key)
├── user_id (UUID, foreign key → profiles/users)
├── training_plan_id (UUID, nullable, foreign key → training_plans)
├── date (DATE)
├── type (TEXT)
├── name (TEXT, nullable)
├── description (TEXT, nullable)
├── duration (INTEGER, seconds, nullable)
├── distance (INTEGER, meters, nullable)
├── notes (TEXT, nullable)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

Workouts with `training_plan_id = NULL` are manually created workouts.
Workouts with a `training_plan_id` are part of a generated training plan.
