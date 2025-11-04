# Quick Start Guide

Get your Dalligi app running in under 10 minutes!

## Prerequisites

- Node.js 18+ installed
- Yarn package manager
- Web browser
- Strava account

## Steps

### 1️⃣ Install Dependencies (1 min)

```bash
yarn install
```

### 2️⃣ Set Up Supabase (3 min)

1. Go to [supabase.com](https://supabase.com) and create account
2. Click "New Project"
3. Choose organization and region
4. Set database password and wait for project creation
5. Go to SQL Editor → New Query
6. Copy entire contents of `supabase-schema.sql` and paste
7. Click "Run" to execute
8. Go to Settings → API to get your credentials:
   - Copy **Project URL**
   - Copy **anon public key**
   - Copy **service_role key** (click "Reveal" first)

### 3️⃣ Create Strava App (2 min)

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Click "Create App" (or use existing)
3. Fill in:
   - **Application Name**: Dalligi Dev
   - **Category**: Training
   - **Club**: (leave blank)
   - **Website**: http://localhost:3000
   - **Authorization Callback Domain**: localhost
   - **Description**: Personal Strava dashboard
4. Agree to terms and create
5. Note your **Client ID** and **Client Secret**

### 4️⃣ Configure Environment Variables (1 min)

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```bash
# From Supabase (step 2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# From Strava (step 3)
STRAVA_CLIENT_ID=12345
STRAVA_CLIENT_SECRET=abc123...

# Already configured
NEXT_PUBLIC_STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/oauth/callback
STRAVA_WEBHOOK_VERIFY_TOKEN=my-secure-token-123
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5️⃣ Start the App (1 min)

```bash
yarn dev
```

### 6️⃣ Test It Out! (2 min)

1. Open http://localhost:3000
2. Click "Connect with Strava"
3. Authorize the application
4. You'll be redirected to your dashboard
5. Click "Sync Activities" to import your Strava data

## That's It! 🎉

You should now see your Strava activities in the dashboard.

## Troubleshooting

### "Failed to exchange code"
- Make sure callback domain in Strava is `localhost` (NOT `http://localhost`)
- Verify Client ID and Secret are correct

### "Database error"
- Check that you ran the SQL schema in Supabase
- Verify your Supabase credentials are correct

### "No activities showing"
- Click the "Sync Activities" button
- Check browser console for errors (F12)
- Make sure you have activities in your Strava account

### "Unauthorized" error
- Clear cookies in browser
- Try the OAuth flow again
- Check that all environment variables are set

## Next Steps

- ✅ Explore the dashboard
- ✅ Check out the code structure
- ✅ Read README.md for detailed documentation
- ✅ See DEPLOYMENT.md when ready to deploy

## Need Help?

- Check SETUP.md for detailed instructions
- Review PROJECT_SUMMARY.md for architecture overview
- Open an issue on GitHub

---

**Pro Tip**: After initial setup, you only need to run `yarn dev` to start developing!
