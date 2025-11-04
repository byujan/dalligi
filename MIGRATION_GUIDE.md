# Database Migration Guide

## Problem

You're getting `ERROR: 42710: type "activity_type" already exists` because the old schema is still in place.

## Solution

Use the migration script that handles existing objects gracefully.

## Steps to Migrate

### Option 1: Clean Migration (Recommended for Development)

**⚠️ WARNING: This deletes all existing data!**

If you're okay starting fresh:

1. **Go to Supabase Dashboard → SQL Editor**

2. **Run this command first:**
   ```sql
   -- Drop everything and start fresh
   DROP TABLE IF EXISTS public.user_sessions CASCADE;
   DROP TABLE IF EXISTS public.activities CASCADE;
   DROP TABLE IF EXISTS public.strava_tokens CASCADE;
   DROP TABLE IF EXISTS public.users CASCADE;
   DROP TYPE IF EXISTS activity_type CASCADE;
   ```

3. **Then run the new schema:**
   - Open `supabase-schema-v2.sql`
   - Copy the entire contents
   - Paste and execute in SQL Editor

### Option 2: Safe Migration (Preserves Structure)

**Recommended if you have existing data you want to keep**

1. **Go to Supabase Dashboard → SQL Editor**

2. **Open the migration file:**
   - File: `supabase-migration.sql`
   - Copy the entire contents

3. **Paste and execute in SQL Editor**

4. **The migration will:**
   - ✅ Handle existing enums gracefully
   - ✅ Create new `profiles` table
   - ✅ Update foreign keys to use `profiles`
   - ✅ Create all necessary triggers
   - ✅ Set up RLS policies
   - ✅ Remove old `user_sessions` table

### Option 3: Manual Step-by-Step

If you want more control:

1. **Check what exists:**
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

2. **Backup data (if needed):**
   ```sql
   CREATE TABLE users_backup AS SELECT * FROM public.users;
   CREATE TABLE activities_backup AS SELECT * FROM public.activities;
   CREATE TABLE strava_tokens_backup AS SELECT * FROM public.strava_tokens;
   ```

3. **Drop old tables:**
   ```sql
   DROP TABLE IF EXISTS public.user_sessions CASCADE;
   DROP TABLE IF EXISTS public.activities CASCADE;
   DROP TABLE IF EXISTS public.strava_tokens CASCADE;
   DROP TABLE IF EXISTS public.users CASCADE;
   ```

4. **Run new schema:**
   - Execute `supabase-schema-v2.sql`

## What Gets Changed

### Tables Renamed/Restructured

| Old Table | New Table | Changes |
|-----------|-----------|---------|
| `users` | `profiles` | Now references `auth.users`, added `strava_connected` flag |
| `strava_tokens` | `strava_tokens` | Foreign key now points to `profiles` |
| `activities` | `activities` | Foreign key now points to `profiles` |
| `user_sessions` | ❌ Removed | No longer needed (Supabase Auth handles this) |

### New Features

- ✅ `profiles` table linked to Supabase Auth
- ✅ Automatic profile creation on signup (via trigger)
- ✅ Support for email/password authentication
- ✅ Support for Google OAuth
- ✅ `strava_connected` flag to track Strava link status

## After Migration

### 1. Enable Email Auth in Supabase

```
Dashboard → Authentication → Providers
- Email: Enable
```

### 2. Enable Google OAuth (Optional)

```
Dashboard → Authentication → Providers → Google
- Enable: ON
- Client ID: [your-google-client-id]
- Client Secret: [your-google-client-secret]
```

### 3. Test the Application

```bash
# Start dev server
yarn dev

# Test signup
http://localhost:3000/signup

# Test login
http://localhost:3000/login

# Test Google OAuth
Click "Continue with Google"
```

## Verification

After migration, verify everything works:

```sql
-- Check that profiles table exists
SELECT * FROM public.profiles LIMIT 1;

-- Check that trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check that RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'strava_tokens', 'activities');
```

Expected results:
- `profiles` table should exist
- `on_auth_user_created` trigger should exist
- All tables should have `rowsecurity = true`

## Troubleshooting

### Error: "relation already exists"

**Solution:**
```sql
DROP TABLE IF EXISTS public.profiles CASCADE;
-- Then run migration again
```

### Error: "type already exists"

**Solution:**
```sql
DROP TYPE IF EXISTS activity_type CASCADE;
-- Then run migration again
```

### Trigger not creating profiles

**Check trigger exists:**
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

**If missing, create it:**
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Cannot authenticate after migration

**Check Supabase Auth is enabled:**
1. Dashboard → Authentication → Providers
2. Ensure "Email" is enabled
3. Try signing up a new user
4. Check profile was created:
   ```sql
   SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 5;
   ```

## Rolling Back

If something goes wrong, you can roll back:

```sql
-- Restore from backups (if you created them)
INSERT INTO public.users SELECT * FROM users_backup;
INSERT INTO public.activities SELECT * FROM activities_backup;
INSERT INTO public.strava_tokens SELECT * FROM strava_tokens_backup;

-- Or start completely fresh
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Then run old schema: supabase-schema.sql
```

## Need Help?

Check these files for more info:
- `AUTH_UPDATE.md` - New authentication flow explained
- `GOOGLE_OAUTH_SETUP.md` - Google sign-in setup
- `supabase-migration.sql` - The migration script itself

---

**Remember:** For development, Option 1 (clean migration) is fastest. For production with existing users, you'll need a more careful migration strategy to preserve user data.
