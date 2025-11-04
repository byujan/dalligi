# Quick Setup Guide

## Step-by-Step Setup

### 1. Install Dependencies
```bash
yarn install
```

### 2. Set Up Supabase Database

1. Create a Supabase project at https://supabase.com
2. Go to the SQL Editor
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Run the SQL script
5. Get your credentials:
   - Project URL: Settings → API → Project URL
   - Anon Key: Settings → API → Project API keys → anon public
   - Service Role Key: Settings → API → Project API keys → service_role

### 3. Create Strava Application

1. Go to https://www.strava.com/settings/api
2. Click "Create App" or use existing app
3. Fill in the details:
   - **Application Name**: Dalligi (or your choice)
   - **Category**: Training
   - **Website**: http://localhost:3000
   - **Authorization Callback Domain**: localhost
4. Save and note your Client ID and Client Secret

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:
```bash
# Supabase (from step 2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Strava (from step 3)
STRAVA_CLIENT_ID=12345
STRAVA_CLIENT_SECRET=abc123...
NEXT_PUBLIC_STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/oauth/callback

# Webhook (create a random secure token)
STRAVA_WEBHOOK_VERIFY_TOKEN=random-secure-token-here
STRAVA_WEBHOOK_SUBSCRIPTION_ID=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run Development Server

```bash
yarn dev
```

Visit http://localhost:3000

### 6. Test the Application

1. Click "Connect with Strava"
2. Authorize the application
3. You should be redirected to the dashboard
4. Click "Sync Activities" to import your Strava activities

## Optional: Deploy Edge Function

For automatic token refresh, deploy the Supabase Edge Function:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project (find ref in project settings)
supabase link --project-ref your-project-ref

# Deploy function
cd supabase/functions/refresh-strava-tokens
supabase functions deploy refresh-strava-tokens

# Set secrets
supabase secrets set STRAVA_CLIENT_ID=your-client-id
supabase secrets set STRAVA_CLIENT_SECRET=your-client-secret
```

## Optional: Set Up Webhooks (Production Only)

Webhooks require a publicly accessible URL. After deploying to production:

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=YOUR_CLIENT_ID \
  -F client_secret=YOUR_CLIENT_SECRET \
  -F callback_url=https://your-domain.com/api/strava/webhook \
  -F verify_token=YOUR_VERIFY_TOKEN
```

Save the returned `id` as `STRAVA_WEBHOOK_SUBSCRIPTION_ID` in your environment variables.

## Troubleshooting

### "Failed to exchange code" error
- Check that your redirect URI exactly matches in both Strava app settings and .env.local
- Ensure the callback domain in Strava is set to `localhost` (not `http://localhost`)

### Database connection errors
- Verify your Supabase URL and keys are correct
- Make sure you ran the SQL schema
- Check that RLS is enabled on tables

### OAuth redirect issues
- Clear browser cookies
- Check that NEXT_PUBLIC_STRAVA_REDIRECT_URI matches your Strava app settings exactly
- Verify your Strava app is not in "Sandbox" mode (or that your account is added to sandbox users)

### No activities showing
- Click "Sync Activities" button
- Check browser console for errors
- Verify Strava API permissions include `activity:read_all`

## Development Commands

```bash
# Run development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Run linter
yarn lint
```

## Next Steps

1. Customize the landing page
2. Add more analytics and charts
3. Set up production deployment (Vercel recommended)
4. Configure webhook subscription for real-time updates
5. Set up Edge Function cron job for token refresh
