-- Migration Script: From old schema to Supabase Auth schema
-- Run this in Supabase SQL Editor

-- Step 1: Drop old trigger if exists (to allow table modifications)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Create activity_type enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM (
    'Run', 'Ride', 'Swim', 'Walk', 'Hike', 'VirtualRide',
    'AlpineSki', 'BackcountrySki', 'Canoeing', 'Crossfit',
    'EBikeRide', 'Elliptical', 'Golf', 'Handcycle', 'IceSkate',
    'InlineSkate', 'Kayaking', 'Kitesurf', 'NordicSki', 'RockClimbing',
    'RollerSki', 'Rowing', 'Snowboard', 'Snowshoe', 'Soccer',
    'StairStepper', 'StandUpPaddling', 'Surfing', 'VirtualRun',
    'WeightTraining', 'Wheelchair', 'Windsurf', 'Workout', 'Yoga'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 3: Drop old tables if they exist (this will delete all data!)
-- WARNING: Uncomment only if you want to start fresh
-- DROP TABLE IF EXISTS public.user_sessions CASCADE;
-- DROP TABLE IF EXISTS public.activities CASCADE;
-- DROP TABLE IF EXISTS public.strava_tokens CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- Step 4: Create profiles table (new)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  strava_athlete_id BIGINT UNIQUE,
  strava_connected BOOLEAN DEFAULT FALSE,
  firstname TEXT,
  lastname TEXT,
  profile_photo TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  sex TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 5: Recreate strava_tokens table with new foreign key
-- First check if old strava_tokens exists and has data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'strava_tokens') THEN
    -- Backup old tokens if table exists
    CREATE TEMP TABLE strava_tokens_backup AS SELECT * FROM public.strava_tokens;
    DROP TABLE public.strava_tokens CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.strava_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Step 6: Recreate activities table with new foreign key
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
    -- Backup old activities if table exists
    CREATE TEMP TABLE activities_backup AS SELECT * FROM public.activities;
    DROP TABLE public.activities CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  strava_activity_id BIGINT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type activity_type NOT NULL,
  sport_type TEXT,
  distance NUMERIC(10, 2),
  moving_time INTEGER,
  elapsed_time INTEGER,
  total_elevation_gain NUMERIC(10, 2),
  start_date TIMESTAMPTZ,
  start_date_local TIMESTAMPTZ,
  timezone TEXT,
  average_speed NUMERIC(10, 2),
  max_speed NUMERIC(10, 2),
  average_heartrate NUMERIC(5, 2),
  max_heartrate INTEGER,
  average_cadence NUMERIC(5, 2),
  average_watts NUMERIC(10, 2),
  kilojoules NUMERIC(10, 2),
  device_watts BOOLEAN,
  has_heartrate BOOLEAN DEFAULT FALSE,
  elev_high NUMERIC(10, 2),
  elev_low NUMERIC(10, 2),
  pr_count INTEGER DEFAULT 0,
  achievement_count INTEGER DEFAULT 0,
  kudos_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  athlete_count INTEGER DEFAULT 1,
  map_polyline TEXT,
  map_summary_polyline TEXT,
  gear_id TEXT,
  external_id TEXT,
  upload_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_strava_athlete_id ON public.profiles(strava_athlete_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_strava_tokens_user_id ON public.strava_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_strava_tokens_expires_at ON public.strava_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_strava_activity_id ON public.activities(strava_activity_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_date ON public.activities(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);

-- Step 8: Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create triggers for updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_strava_tokens_updated_at ON public.strava_tokens;
CREATE TRIGGER set_strava_tokens_updated_at
  BEFORE UPDATE ON public.strava_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_activities_updated_at ON public.activities;
CREATE TRIGGER set_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Step 10: Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 12: Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strava_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Step 13: Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.strava_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON public.strava_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON public.strava_tokens;
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;
DROP POLICY IF EXISTS "Service role has full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role has full access to strava_tokens" ON public.strava_tokens;
DROP POLICY IF EXISTS "Service role has full access to activities" ON public.activities;

-- Step 14: Create RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Step 15: Create RLS Policies for strava_tokens
CREATE POLICY "Users can view their own tokens"
  ON public.strava_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
  ON public.strava_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
  ON public.strava_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- Step 16: Create RLS Policies for activities
CREATE POLICY "Users can view their own activities"
  ON public.activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
  ON public.activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
  ON public.activities FOR DELETE
  USING (auth.uid() = user_id);

-- Step 17: Service role policies
CREATE POLICY "Service role has full access to profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to strava_tokens"
  ON public.strava_tokens FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to activities"
  ON public.activities FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 18: Drop old user_sessions table if exists (no longer needed)
DROP TABLE IF EXISTS public.user_sessions CASCADE;

-- Migration complete!
-- You can now use email/password or Google OAuth to sign up/in
