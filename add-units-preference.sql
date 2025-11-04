-- Add units preference to profiles table
-- Run this in your Supabase SQL editor

-- Create units enum type
DO $$ BEGIN
  CREATE TYPE units_preference AS ENUM ('metric', 'imperial');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add units column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS units_preference units_preference DEFAULT 'metric';

-- Update existing profiles to have metric as default
UPDATE public.profiles
SET units_preference = 'metric'
WHERE units_preference IS NULL;
