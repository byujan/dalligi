import { NextRequest, NextResponse } from 'next/server'

const STRAVA_AUTHORIZE_URL = 'https://www.strava.com/oauth/authorize'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const redirectAfterAuth = searchParams.get('redirect') || '/dashboard'

    // Build Strava authorization URL
    const params = new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID!,
      redirect_uri: process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI!,
      response_type: 'code',
      approval_prompt: 'auto',
      scope: 'read,activity:read_all,activity:write',
      state: redirectAfterAuth, // Pass redirect path in state
    })

    const authUrl = `${STRAVA_AUTHORIZE_URL}?${params.toString()}`

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Error initiating Strava OAuth:', error)
    return NextResponse.json(
      { error: 'Failed to initiate authentication' },
      { status: 500 }
    )
  }
}
