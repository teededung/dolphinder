# 🚀 Quickstart Guide

Get Dolphinder up and running in 10 minutes!

## Prerequisites

- Node.js 18+ and pnpm installed
- Supabase account (free)
- GitHub account

## Step 1: Clone & Install (2 min)

```bash
git clone <repository-url>
cd dolphinder
pnpm install
```

## Step 2: Supabase Setup (3 min)

### Create Project

1. Go to [supabase.com](https://supabase.com/dashboard)
2. Click "New Project"
3. Wait for provisioning

### Run Migration

1. Go to SQL Editor in Supabase dashboard
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and click "Run"

### Get Credentials

1. Go to Project Settings > API
2. Copy:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key

## Step 3: Environment Setup (1 min)

```bash
cp env.example .env
```

Edit `.env`:

```env
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
ADMIN_EMAILS=your-email@example.com
```

## Step 4: GitHub OAuth (2 min)

### In Supabase

1. Go to Authentication > Providers
2. Enable GitHub
3. Copy the Callback URL

### In GitHub

1. Go to Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - Name: Dolphinder Dev
   - Homepage: `http://localhost:4321`
   - Callback: (paste from Supabase)
4. Create app
5. Copy Client ID and Client Secret

### Back to Supabase

1. Paste Client ID and Secret
2. Save

## Step 5: Migrate Data (1 min)

```bash
pnpm migrate
```

This will import all existing developers from JSON to database.

## Step 6: Create Admin (1 min)

### In Supabase Dashboard

1. Go to Authentication > Users
2. Click "Add User"
3. Enter your email (same as ADMIN_EMAILS)
4. Create password
5. Enable "Auto Confirm User"

## Step 7: Start! (30 sec)

```bash
pnpm dev
```

Open `http://localhost:4321`

## ✅ Verify Setup

1. Visit `http://localhost:4321/developers` - Should see developers
2. Visit `http://localhost:4321/register` - Should see GitHub button
3. Visit `http://localhost:4321/admin/login` - Login with admin account
4. Should see admin dashboard

## 🎉 You're Done!

### Next Steps

- Try registering with GitHub OAuth
- Test the admin dashboard
- Edit a developer profile
- Upload an avatar

### Need Help?

- Check `SETUP_GUIDE.md` for detailed instructions
- Check `DEV_NOTES.md` for development tips
- Check `ADMIN_SETUP.md` for admin configuration

---

**Total Time**: ~10 minutes
**Difficulty**: Easy
**Status**: Ready to code! 🚀
