# 달리기 (Dalligi) - Strava Dashboard

A production-ready Next.js 14 web application that provides beautiful insights and analytics for your Strava activities. Built with modern web technologies and designed for real-world usage.

## Features

- **Strava OAuth 2.0 Authentication** - Secure sign-in with Strava
- **Automatic Activity Sync** - Real-time webhook integration for instant updates
- **Beautiful Dashboard** - View activity metrics with clean, modern UI
- **Comprehensive Analytics** - Track distance, time, elevation, heart rate, and more
- **Token Management** - Automatic token refresh via Supabase Edge Functions
- **Protected Routes** - Secure middleware-based authentication
- **Responsive Design** - Works seamlessly on all devices
- **Production-Ready** - Robust error handling, loading states, and TypeScript throughout

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes, Supabase Edge Functions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Strava OAuth 2.0 with session management
- **API**: Strava API v3

## Architecture

```
├── src/
│   ├── app/                        # Next.js 14 App Router
│   │   ├── api/                    # API routes
│   │   │   ├── auth/               # Authentication endpoints
│   │   │   │   ├── strava/         # Strava OAuth initiation
│   │   │   │   └── logout/         # Logout endpoint
│   │   │   ├── strava/
│   │   │   │   ├── oauth/callback/ # OAuth callback handler
│   │   │   │   └── webhook/        # Strava webhook endpoint
│   │   │   └── activities/
│   │   │       └── sync/           # Manual activity sync
│   │   ├── dashboard/              # Protected dashboard page
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Landing page
│   ├── components/                 # React components
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── activity-card.tsx       # Activity display card
│   │   ├── metric-card.tsx         # Summary metric card
│   │   └── header.tsx              # App header
│   ├── lib/                        # Utilities and libraries
│   │   ├── supabase/               # Supabase client config
│   │   ├── auth.ts                 # Authentication helpers
│   │   ├── strava.ts               # Strava API integration
│   │   └── utils.ts                # Utility functions
│   ├── types/                      # TypeScript type definitions
│   └── middleware.ts               # Route protection middleware
├── supabase/
│   └── functions/                  # Supabase Edge Functions
│       └── refresh-strava-tokens/  # Token refresh cron job
└── supabase-schema.sql             # Database schema
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and yarn
- Supabase account
- Strava API application

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd dalligi
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database schema:
   - Go to SQL Editor in Supabase Dashboard
   - Copy and paste the contents of `supabase-schema.sql`
   - Execute the SQL script

### 4. Create Strava Application

1. Go to [Strava API Settings](https://www.strava.com/settings/api)
2. Create a new application
3. Set authorization callback domain to: `localhost:3000` (for development)
4. Note down your `Client ID` and `Client Secret`

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Strava OAuth Configuration
STRAVA_CLIENT_ID=your-strava-client-id
STRAVA_CLIENT_SECRET=your-strava-client-secret
NEXT_PUBLIC_STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/oauth/callback

# Strava Webhook Configuration
STRAVA_WEBHOOK_VERIFY_TOKEN=choose-a-random-secure-token
STRAVA_WEBHOOK_SUBSCRIPTION_ID=will-be-provided-after-setup

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Deploy Supabase Edge Function

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the edge function
supabase functions deploy refresh-strava-tokens

# Set up environment variables for the function
supabase secrets set STRAVA_CLIENT_ID=your-client-id
supabase secrets set STRAVA_CLIENT_SECRET=your-client-secret
```

### 7. Set Up Strava Webhook (Optional but Recommended)

1. Deploy your app to a production environment (Vercel, etc.)
2. Use the following API call to create a webhook subscription:

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=YOUR_CLIENT_ID \
  -F client_secret=YOUR_CLIENT_SECRET \
  -F callback_url=https://your-domain.com/api/strava/webhook \
  -F verify_token=YOUR_VERIFY_TOKEN
```

3. Save the subscription ID in your environment variables

### 8. Run Development Server

```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Database Schema

The application uses the following main tables:

- **users** - Stores Strava athlete information
- **strava_tokens** - Stores OAuth tokens with automatic refresh
- **activities** - Stores synced Strava activities
- **user_sessions** - Manages user authentication sessions

See `supabase-schema.sql` for complete schema with indexes and RLS policies.

## API Endpoints

### Authentication
- `GET /api/auth/strava` - Initiates Strava OAuth flow
- `GET /api/strava/oauth/callback` - Handles OAuth callback
- `POST /api/auth/logout` - Logs out user

### Activities
- `POST /api/activities/sync` - Manually sync activities from Strava
- `GET /api/strava/webhook` - Webhook verification
- `POST /api/strava/webhook` - Receives activity updates

## Key Features Explained

### OAuth Flow
1. User clicks "Connect with Strava"
2. Redirected to Strava for authorization
3. Callback exchanges code for tokens
4. User and tokens stored in Supabase
5. Session created and user redirected to dashboard

### Token Refresh
- Tokens automatically refresh when within 5 minutes of expiration
- Edge function can be scheduled to refresh all tokens periodically
- Refresh happens transparently during API calls

### Activity Sync
- Manual sync via "Sync Activities" button
- Automatic sync via Strava webhooks
- Supports create, update, and delete events

### Route Protection
- Middleware checks for valid session cookie
- Unauthenticated users redirected to landing page
- Server-side session validation

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add all environment variables
4. Deploy

### Environment Variables for Production

Update these values for production:
```bash
NEXT_PUBLIC_STRAVA_REDIRECT_URI=https://your-domain.com/api/strava/oauth/callback
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Post-Deployment

1. Update Strava app settings with production callback URL
2. Set up webhook subscription with production URL
3. Configure Supabase Edge Function to run on a schedule:
   ```sql
   SELECT cron.schedule(
     'refresh-strava-tokens',
     '0 */6 * * *', -- Every 6 hours
     $$
     SELECT net.http_post(
       url:='https://your-project-ref.supabase.co/functions/v1/refresh-strava-tokens',
       headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
     );
     $$
   );
   ```

## Development Tips

### Type Safety
- All API responses are typed
- Database types auto-generated from schema
- Strict TypeScript configuration

### Code Organization
- Server components by default (better performance)
- Client components only when needed ('use client')
- Reusable UI components in `/components/ui`
- Business logic in `/lib`

### Performance
- Automatic image optimization
- Route prefetching
- Efficient database queries with indexes
- Loading states for better UX

## Troubleshooting

### OAuth Issues
- Verify callback URL matches exactly (including http/https)
- Check Strava app approval status
- Ensure scopes are correct: `read,activity:read_all,activity:write`

### Database Issues
- Verify RLS policies are set correctly
- Check service role key for admin operations
- Ensure indexes are created for performance

### Token Refresh Issues
- Verify edge function environment variables
- Check token expiration logic (5 minute buffer)
- Monitor edge function logs

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions, please open a GitHub issue.
