-- Supabase Authentication Schema v2
-- This schema uses Supabase Auth for user management and links Strava optionally

-- Create custom types
CREATE TYPE activity_type AS ENUM (
  'Run', 'Ride', 'Swim', 'Walk', 'Hike', 'VirtualRide',
  'AlpineSki', 'BackcountrySki', 'Canoeing', 'Crossfit',
  'EBikeRide', 'Elliptical', 'Golf', 'Handcycle', 'IceSkate',
  'InlineSkate', 'Kayaking', 'Kitesurf', 'NordicSki', 'RockClimbing',
  'RollerSki', 'Rowing', 'Snowboard', 'Snowshoe', 'Soccer',
  'StairStepper', 'StandUpPaddling', 'Surfing', 'VirtualRun',
  'WeightTraining', 'Wheelchair', 'Windsurf', 'Workout', 'Yoga'
);

-- User profiles table (extends Supabase auth.users)
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

-- Strava tokens table
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

-- Activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  strava_activity_id BIGINT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type activity_type NOT NULL,
  sport_type TEXT,
  distance NUMERIC(10, 2), -- meters
  moving_time INTEGER, -- seconds
  elapsed_time INTEGER, -- seconds
  total_elevation_gain NUMERIC(10, 2), -- meters
  start_date TIMESTAMPTZ,
  start_date_local TIMESTAMPTZ,
  timezone TEXT,
  average_speed NUMERIC(10, 2), -- m/s
  max_speed NUMERIC(10, 2), -- m/s
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_strava_athlete_id ON public.profiles(strava_athlete_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_strava_tokens_user_id ON public.strava_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_strava_tokens_expires_at ON public.strava_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_strava_activity_id ON public.activities(strava_activity_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_date ON public.activities(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_strava_tokens_updated_at
  BEFORE UPDATE ON public.strava_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strava_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for strava_tokens table
CREATE POLICY "Users can view their own tokens"
  ON public.strava_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
  ON public.strava_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
  ON public.strava_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for activities table
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

-- Service role policies (for admin operations)
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
