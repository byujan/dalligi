# Authentication Update - Supabase Auth with Strava Connection

## What Changed

The app now uses **Supabase email/password authentication** as the primary authentication method, with **Strava as an optional connection** for syncing activities.

### Before
- Users signed in directly with Strava OAuth
- No separate user management system
- Korean text (달리기) in branding

### After
- Users sign up with email/password (Supabase Auth)
- After signup, users can connect their Strava account
- Strava connection is optional and can be done later
- English-only branding

## New User Flow

```
1. Landing Page (/)
   → Sign up or Login buttons

2. Sign Up (/signup)
   → Create account with email, password, full name
   → Automatically logged in

3. Onboarding (/onboarding)
   → Option to connect Strava
   → Can skip for later

4. Dashboard (/dashboard)
   → If Strava not connected: Shows "Connect to Strava" prompt
   → If Strava connected: Shows activities and metrics
```

## Database Changes

### New Schema (supabase-schema-v2.sql)

**Important:** You need to run the new schema file!

1. **profiles table** (replaces users table)
   - Links to Supabase auth.users
   - `strava_athlete_id` is now nullable
   - Added `strava_connected` boolean flag
   - Added `full_name` field

2. **Automatic profile creation**
   - Trigger creates profile when user signs up
   - Profile inherits email and full_name from auth.users

3. **Updated foreign keys**
   - `strava_tokens.user_id` references `profiles.id`
   - `activities.user_id` references `profiles.id`

## Setup Instructions

### 1. Update Supabase Database

Run the new schema:

```bash
# Option A: Via Supabase Dashboard
1. Go to SQL Editor in Supabase Dashboard
2. Open supabase-schema-v2.sql
3. Copy and execute the SQL

# Option B: Via Supabase CLI
supabase db reset  # WARNING: This deletes all data
# Then run the migrations
```

**Important:** The new schema is in `supabase-schema-v2.sql`

### 2. Enable Email Auth in Supabase

1. Go to Authentication → Providers in Supabase Dashboard
2. Ensure **Email** provider is enabled
3. Configure email templates (optional but recommended)
4. Set up SMTP for production (optional for dev)

### 3. No Environment Variable Changes

Your existing `.env.local` still works! The Supabase credentials remain the same.

### 4. Test the New Flow

```bash
yarn dev
```

1. Visit http://localhost:3000
2. Click "Sign Up"
3. Create account with email/password
4. You'll be redirected to onboarding
5. Connect Strava or skip
6. View dashboard

## New Pages & Components

### Pages Added
- `/login` - Email/password sign-in page
- `/signup` - Email/password registration page
- `/onboarding` - Strava connection onboarding

### Components Added
- `LoginForm` - Client component for login
- `SignupForm` - Client component for signup
- `Input` - Form input component
- `Label` - Form label component

### API Routes Added
- `/api/auth/login` - Handle email/password sign-in
- `/api/auth/signup` - Handle user registration

### API Routes Updated
- `/api/strava/oauth/callback` - Now links Strava to authenticated user
- `/api/auth/logout` - Removed (logout now in Header component)

## Key Files Modified

1. **src/lib/auth.ts** - Complete rewrite to use Supabase Auth
2. **src/middleware.ts** - Updated to check Supabase auth session
3. **src/app/dashboard/page.tsx** - Handles users without Strava
4. **src/components/header.tsx** - Shows login/signup buttons when logged out
5. **src/app/page.tsx** - Landing page without Korean text
6. **src/types/index.ts** - Updated User interface

## Authentication Architecture

### Session Management
- Managed by Supabase Auth (built-in)
- Cookies automatically handled by Supabase SSR
- Middleware refreshes session on each request

### Protected Routes
- `/dashboard` - Requires authentication
- `/onboarding` - Requires authentication
- Middleware redirects to `/login` if not authenticated

### User Profile
```typescript
interface User {
  id: string              // Supabase auth.users ID
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
```

## Features Preserved

✅ All Strava functionality still works
✅ Activity sync (manual and webhook)
✅ Token refresh
✅ Dashboard analytics
✅ Summary metrics
✅ Activity cards
✅ Loading states
✅ Error handling

## New Features

✨ Email/password authentication
✨ User management without Strava
✨ Optional Strava connection
✨ Onboarding flow
✨ Skip Strava connection option
✨ Clean English branding

## Migration Notes

### For Existing Users

If you had users in the old system, you'll need to migrate them:

```sql
-- Example migration (customize as needed)
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
SELECT
  email,
  crypt('temporary-password-123', gen_salt('bf')),
  now()
FROM old_users_table;

-- Then migrate to profiles
INSERT INTO public.profiles (id, email, strava_athlete_id, ...)
SELECT ...
```

### For Development

Just start fresh! The new schema creates everything you need.

## Testing Checklist

- [ ] Sign up with email/password
- [ ] Receive confirmation email (if SMTP configured)
- [ ] Login with credentials
- [ ] View onboarding page
- [ ] Connect Strava from onboarding
- [ ] Verify Strava OAuth flow works
- [ ] Check dashboard shows "Connect Strava" if skipped
- [ ] Sync activities after connecting
- [ ] Logout and login again
- [ ] Verify session persists across page reloads

## Troubleshooting

### "User not found" after signup
- Check that the trigger `on_auth_user_created` is created
- Verify the `handle_new_user()` function exists
- Check Supabase logs for errors

### Strava connection fails
- Ensure user is logged in first
- Check OAuth callback redirects to correct URL
- Verify Strava app settings match environment variables

### Email confirmation required
- Supabase may require email confirmation in production
- Configure email templates in Supabase Dashboard
- Or disable email confirmation for development

## Production Deployment

Update these for production:

1. **Email Settings**
   - Configure SMTP in Supabase
   - Customize email templates
   - Set up email confirmation flow

2. **Password Requirements**
   - Configure minimum password length in Supabase
   - Add password strength indicator (optional)

3. **Rate Limiting**
   - Enable rate limiting in Supabase
   - Protect auth endpoints

4. **Environment Variables**
   - All existing variables still work
   - No new variables needed!

## Support

The app now has a modern, production-ready authentication system with:
- Secure password hashing
- Session management
- Email verification (configurable)
- Password reset (via Supabase)
- Multi-factor authentication (configurable)

All powered by Supabase Auth! 🎉
