import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface User {
  id: string
  email: string | null
  fullName: string | null
  stravaConnected: boolean
  stravaAthleteId: number | null
  profilePhoto: string | null
  firstname: string | null
  lastname: string | null
  city: string | null
  state: string | null
  country: string | null
}

/**
 * Get the current authenticated user from Supabase Auth
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return null
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (profileError || !profile) {
    return null
  }

  return {
    id: profile.id,
    email: profile.email || authUser.email,
    fullName: profile.full_name,
    stravaConnected: profile.strava_connected || false,
    stravaAthleteId: profile.strava_athlete_id,
    profilePhoto: profile.profile_photo,
    firstname: profile.firstname,
    lastname: profile.lastname,
    city: profile.city,
    state: profile.state,
    country: profile.country,
  }
}

/**
 * Require authentication - redirects if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

/**
 * Require Strava connection - redirects if not connected
 */
export async function requireStravaConnection(): Promise<User> {
  const user = await requireAuth()

  if (!user.stravaConnected) {
    redirect('/onboarding')
  }

  return user
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(email: string, password: string, fullName: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * Sign in a user with email and password
 */
export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }
}
