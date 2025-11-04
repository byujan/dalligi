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

-- Users table (linked to Strava athletes)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strava_athlete_id BIGINT UNIQUE NOT NULL,
  email TEXT,
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
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- User sessions table (for app-level session management)
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_strava_athlete_id ON public.users(strava_athlete_id);
CREATE INDEX IF NOT EXISTS idx_strava_tokens_user_id ON public.strava_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_strava_tokens_expires_at ON public.strava_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_strava_activity_id ON public.activities(strava_activity_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_date ON public.activities(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
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

CREATE TRIGGER set_user_sessions_updated_at
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strava_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own data"
  ON public.users FOR UPDATE
  USING (id = auth.uid());

-- RLS Policies for strava_tokens table
CREATE POLICY "Users can view their own tokens"
  ON public.strava_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own tokens"
  ON public.strava_tokens FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for activities table
CREATE POLICY "Users can view their own activities"
  ON public.activities FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own activities"
  ON public.activities FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own activities"
  ON public.activities FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own activities"
  ON public.activities FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for user_sessions table
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own sessions"
  ON public.user_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
  ON public.user_sessions FOR DELETE
  USING (user_id = auth.uid());

-- Service role policies (bypass RLS for service operations)
CREATE POLICY "Service role has full access to users"
  ON public.users FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to strava_tokens"
  ON public.strava_tokens FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to activities"
  ON public.activities FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to user_sessions"
  ON public.user_sessions FOR ALL
  USING (true)
  WITH CHECK (true);
