import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRAVA_OAUTH_BASE = 'https://www.strava.com/oauth'

interface StravaTokenRefreshResponse {
  token_type: 'Bearer'
  access_token: string
  expires_at: number
  expires_in: number
  refresh_token: string
}

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all tokens that are about to expire (within 1 hour)
    const oneHourFromNow = Math.floor(Date.now() / 1000) + 3600

    const { data: tokens, error: fetchError } = await supabaseClient
      .from('strava_tokens')
      .select('*')
      .lt('expires_at', oneHourFromNow)

    if (fetchError) {
      throw new Error(`Failed to fetch tokens: ${fetchError.message}`)
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No tokens to refresh', count: 0 }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    let refreshedCount = 0
    const errors: string[] = []

    // Refresh each expired token
    for (const token of tokens) {
      try {
        const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: Deno.env.get('STRAVA_CLIENT_ID'),
            client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
            grant_type: 'refresh_token',
            refresh_token: token.refresh_token,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`Strava API error: ${errorData.message || response.statusText}`)
        }

        const refreshedToken: StravaTokenRefreshResponse = await response.json()

        // Update token in database
        const { error: updateError } = await supabaseClient
          .from('strava_tokens')
          .update({
            access_token: refreshedToken.access_token,
            refresh_token: refreshedToken.refresh_token,
            expires_at: refreshedToken.expires_at,
          })
          .eq('id', token.id)

        if (updateError) {
          throw new Error(`Failed to update token: ${updateError.message}`)
        }

        refreshedCount++
      } catch (error) {
        const errorMessage = `Failed to refresh token for user ${token.user_id}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
        console.error(errorMessage)
        errors.push(errorMessage)
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Token refresh complete',
        total: tokens.length,
        refreshed: refreshedCount,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in refresh-strava-tokens function:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
