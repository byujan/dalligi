import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken } from '@/lib/strava'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // redirect path or onboarding flag
    const error = searchParams.get('error')
    const scope = searchParams.get('scope')

    // Handle OAuth errors
    if (error) {
      console.error('Strava OAuth error:', error)
      return NextResponse.redirect(
        new URL(`/onboarding?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    // Validate authorization code
    if (!code) {
      return NextResponse.redirect(
        new URL('/onboarding?error=missing_code', request.url)
      )
    }

    const supabase = await createClient()

    // Get current authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.redirect(
        new URL('/login?error=authentication_required&redirect=/onboarding', request.url)
      )
    }

    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForToken(code)

    // Update user profile with Strava data
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        strava_athlete_id: tokenResponse.athlete.id,
        strava_connected: true,
        firstname: tokenResponse.athlete.firstname,
        lastname: tokenResponse.athlete.lastname,
        profile_photo: tokenResponse.athlete.profile,
        city: tokenResponse.athlete.city,
        state: tokenResponse.athlete.state,
        country: tokenResponse.athlete.country,
        sex: tokenResponse.athlete.sex,
      })
      .eq('id', authUser.id)

    if (updateProfileError) {
      throw new Error(`Failed to update profile: ${updateProfileError.message}`)
    }

    // Check if tokens already exist
    const { data: existingToken } = await supabase
      .from('strava_tokens')
      .select('id')
      .eq('user_id', authUser.id)
      .single()

    if (existingToken) {
      // Update existing tokens
      const { error: updateTokenError } = await supabase
        .from('strava_tokens')
        .update({
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_at: tokenResponse.expires_at,
          scope: scope || tokenResponse.athlete.resource_state.toString(),
        })
        .eq('user_id', authUser.id)

      if (updateTokenError) {
        throw new Error(`Failed to update tokens: ${updateTokenError.message}`)
      }
    } else {
      // Insert new tokens
      const { error: createTokenError } = await supabase
        .from('strava_tokens')
        .insert({
          user_id: authUser.id,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_at: tokenResponse.expires_at,
          scope: scope || tokenResponse.athlete.resource_state.toString(),
        })

      if (createTokenError) {
        throw new Error(`Failed to store tokens: ${createTokenError.message}`)
      }
    }

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard?strava_connected=true', request.url))
  } catch (error) {
    console.error('Error in OAuth callback:', error)
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
    return NextResponse.redirect(
      new URL(`/onboarding?error=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }
}
