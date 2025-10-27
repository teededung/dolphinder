# Dolphinder Web2 Platform Setup Guide

This guide will help you set up the Dolphinder developer platform with Supabase integration.

## Prerequisites

- Node.js 18+ and pnpm installed
- Supabase account (free tier is fine)
- GitHub account for OAuth setup

## 1. Supabase Project Setup

### Create a New Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Note down your project URL and API keys from Project Settings > API

### Run Database Migration

1. Install Supabase CLI:

```bash
npm install -g supabase
```

2. Link your project:

```bash
supabase link --project-ref your-project-ref
```

3. Push the migration:

```bash
supabase db push
```

Or manually run the SQL in `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor.

## 2. Environment Variables Setup

1. Copy `env.example` to `.env`:

```bash
cp env.example .env
```

2. Fill in your Supabase credentials:

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAILS=your-admin-email@example.com
PUBLIC_ADMIN_EMAILS=your-admin-email@example.com
```

## 3. GitHub OAuth Setup

### In Supabase Dashboard

1. Go to Authentication > Providers
2. Enable GitHub provider
3. Note the Callback URL (should be like `https://your-project.supabase.co/auth/v1/callback`)

### In GitHub

1. Go to Settings > Developer settings > OAuth Apps > New OAuth App
2. Fill in:
   - Application name: Dolphinder
   - Homepage URL: `http://localhost:4321` (for dev) or your production URL
   - Authorization callback URL: Use the callback URL from Supabase
3. Create the app and note down Client ID and Client Secret
4. Go back to Supabase and enter the Client ID and Client Secret in the GitHub provider settings

## 4. Migrate Existing Data

Run the migration script to import existing JSON developers to Supabase:

```bash
pnpm install tsx
pnpm migrate
```

This will:

- Read all JSON files in `src/data/developers/`
- Download external avatars to `public/avatar/`
- Create auth users for each developer
- Insert developer profiles with `is_verified=true`

## 5. Install Dependencies and Run

```bash
pnpm install
pnpm dev
```

## 6. Create Admin Account

### Option 1: Using Supabase Dashboard

1. Go to Authentication > Users
2. Create a new user with your admin email
3. Set a password

### Option 2: Via Sign Up

1. Use the register page to sign up with GitHub
2. Then manually update your email in Supabase to match ADMIN_EMAILS

## Usage

### Admin Dashboard

- Login at `/admin/login` with your admin email/password
- View pending developer verifications
- Approve or reject new developers
- Revoke verification from existing developers

### User Registration

- New users sign up at `/register` using GitHub OAuth
- Profile is auto-created with GitHub data
- Avatar is automatically downloaded
- Status starts as `is_verified=false` (pending admin approval)

### User Dashboard

- After login, users access `/dashboard`
- Edit profile information:
  - Name, bio, entry level
  - Social links (GitHub, LinkedIn, Telegram)
  - Sui wallet address
  - Avatar upload
- Changes are saved immediately
- Profile won't be public until admin approves

### Public Pages

- `/developers` - Lists all verified developers (merged from Supabase + JSON fallback)
- `/{username}` - Individual developer profile (only visible if verified or viewing own profile)

## Database Schema

### `developers` table

- `id` - UUID primary key
- `user_id` - Foreign key to auth.users
- `username` - Unique username
- `name` - Display name
- `avatar` - Local path to avatar image
- `github`, `linkedin`, `telegram` - Social links
- `bio` - Short bio
- `slush_wallet` - Sui wallet address
- `entry` - Developer level/role
- `is_verified` - Admin approval status
- `created_at`, `updated_at` - Timestamps

## API Routes

- `POST /api/admin/verify` - Admin approve/reject/revoke (requires admin auth)
- `POST /api/profile/update` - User update own profile (requires auth)
- `GET /api/auth/callback` - GitHub OAuth callback
- `GET /api/supabase/health` - Check Supabase connection

## Security

- Row Level Security (RLS) enabled on `developers` table
- Public can only read verified developers
- Users can only update their own profiles
- Admin verification is protected by `ADMIN_EMAILS` check
- Service role key used only in server-side migration script

## Troubleshooting

### Migration fails

- Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Ensure database migration has been run first
- Check network connectivity to external avatar URLs

### OAuth not working

- Verify callback URL matches in both GitHub and Supabase
- Check that GitHub OAuth app is not suspended
- Ensure `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` are set

### Avatar upload fails

- Check file size (max 5MB)
- Ensure `public/avatar/` directory has write permissions
- Verify file type is supported (JPG, PNG, GIF, WebP)

## Next Steps

This completes the Web2 implementation. On-chain features (Walrus, Sui integration) will be added in a future phase.
