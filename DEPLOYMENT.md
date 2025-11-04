# Deployment Guide

## Deploying to Vercel (Recommended)

Vercel is the recommended platform for deploying Next.js applications.

### Prerequisites

- GitHub account
- Vercel account (sign up at https://vercel.com)
- Completed local setup (Supabase database, Strava app)

### Steps

#### 1. Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/dalligi.git
git push -u origin main
```

#### 2. Deploy to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `yarn build`
   - **Output Directory**: .next
   - **Install Command**: `yarn install`

#### 3. Add Environment Variables

In Vercel project settings → Environment Variables, add:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Strava OAuth
STRAVA_CLIENT_ID=12345
STRAVA_CLIENT_SECRET=abc123...
NEXT_PUBLIC_STRAVA_REDIRECT_URI=https://your-domain.vercel.app/api/strava/oauth/callback

# Webhook
STRAVA_WEBHOOK_VERIFY_TOKEN=random-secure-token
STRAVA_WEBHOOK_SUBSCRIPTION_ID=

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### 4. Deploy

Click "Deploy" and wait for the build to complete.

#### 5. Update Strava App Settings

1. Go to https://www.strava.com/settings/api
2. Update your app's "Authorization Callback Domain" to: `your-domain.vercel.app`
3. Update "Website" to: `https://your-domain.vercel.app`
4. Save changes

#### 6. Set Up Webhook Subscription

Run this command with your production URL:

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=YOUR_CLIENT_ID \
  -F client_secret=YOUR_CLIENT_SECRET \
  -F callback_url=https://your-domain.vercel.app/api/strava/webhook \
  -F verify_token=YOUR_VERIFY_TOKEN
```

You'll receive a response like:
```json
{
  "id": 123456,
  "application_id": 12345,
  "callback_url": "https://your-domain.vercel.app/api/strava/webhook",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

Add the `id` to your Vercel environment variables as `STRAVA_WEBHOOK_SUBSCRIPTION_ID`.

## Deploying to Other Platforms

### Netlify

1. Build command: `yarn build`
2. Publish directory: `.next`
3. Add the same environment variables
4. Update Strava callback URL accordingly

### Self-Hosted (Docker)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

Update `next.config.js`:
```javascript
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['dgalywyr863.cloudfront.net'],
  },
}
```

Build and run:
```bash
docker build -t dalligi .
docker run -p 3000:3000 --env-file .env.production dalligi
```

## Post-Deployment Setup

### 1. Configure Supabase Edge Function Cron Job

In your Supabase SQL Editor, run:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule token refresh every 6 hours
SELECT cron.schedule(
  'refresh-strava-tokens',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url:='https://your-project-ref.supabase.co/functions/v1/refresh-strava-tokens',
    headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

### 2. Test Your Deployment

1. Visit your production URL
2. Click "Connect with Strava"
3. Complete OAuth flow
4. Sync activities
5. Verify webhooks are working (create a test activity on Strava)

### 3. Monitor Your Application

#### Vercel Analytics
- Enable in Vercel dashboard for free
- Track page views and performance

#### Supabase Monitoring
- Check Database → Query Performance
- Monitor Edge Function logs
- Review RLS policies

#### Strava Webhook Health
Check subscription status:
```bash
curl -G https://www.strava.com/api/v3/push_subscriptions \
  -d client_id=YOUR_CLIENT_ID \
  -d client_secret=YOUR_CLIENT_SECRET
```

## Troubleshooting Production Issues

### OAuth Not Working
- Verify callback URL matches exactly (https vs http)
- Check environment variables are set correctly
- Ensure Strava app is approved (not in sandbox mode)

### Webhooks Not Receiving Events
- Verify subscription is active
- Check webhook endpoint is publicly accessible
- Review Vercel function logs for errors
- Ensure verify token matches

### Database Connection Issues
- Verify Supabase credentials
- Check RLS policies
- Review connection pooling settings

### Performance Issues
- Enable Vercel Edge Functions for faster response times
- Add database indexes (already included in schema)
- Consider implementing Redis caching for frequently accessed data

## Security Checklist

- [ ] All environment variables set correctly
- [ ] Service role key kept secret (server-side only)
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] RLS policies enabled on all tables
- [ ] CORS configured correctly
- [ ] Webhook verify token is random and secure
- [ ] Session cookies are httpOnly and secure
- [ ] No sensitive data in client-side code
- [ ] Regular dependency updates

## Scaling Considerations

As your application grows, consider:

1. **Database Optimization**
   - Add pagination to activity list
   - Implement database connection pooling
   - Add composite indexes for common queries

2. **Caching**
   - Cache activity summaries
   - Use Vercel Edge Cache for static content
   - Implement Redis for session storage

3. **Edge Functions**
   - Move token refresh to edge function
   - Cache Strava API responses
   - Rate limit API endpoints

4. **Monitoring**
   - Set up error tracking (Sentry)
   - Monitor API rate limits
   - Track database performance

## Custom Domain Setup

1. Add domain in Vercel project settings
2. Update DNS records as instructed
3. Update all environment variables with new domain
4. Update Strava app callback URL
5. Recreate webhook subscription with new URL

## Rollback Procedure

If something goes wrong:

1. Go to Vercel dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Verify application is working
5. Fix issues in development
6. Redeploy when ready

## Support

For deployment issues:
- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/support
- Strava API: https://developers.strava.com/docs/getting-started/
