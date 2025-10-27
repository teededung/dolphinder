# Admin Account Setup Guide

This guide explains how to create and configure admin accounts for the Dolphinder platform.

## Method 1: Create Admin via Supabase Dashboard (Recommended)

### Step 1: Access Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Users**

### Step 2: Create New User

1. Click **"Add User"** or **"Invite User"**
2. Enter:
   - **Email**: Must match one of the emails in `ADMIN_EMAILS` env variable
   - **Password**: Create a secure password
   - **Auto Confirm User**: Enable this option
3. Click **Create User**

### Step 3: Configure Environment Variables

Make sure your `.env` file includes the admin email:

```env
ADMIN_EMAILS=admin@yourdomain.com,other-admin@yourdomain.com
```

Multiple admins can be added by separating emails with commas.

### Step 4: Login

1. Go to `/admin/login` on your Dolphinder site
2. Login with the email and password you created
3. You'll be redirected to the admin dashboard

## Method 2: Self-Registration then Manual Promotion

### Step 1: Register via GitHub OAuth

1. Visit `/register` on your site
2. Sign up using GitHub OAuth
3. Complete profile setup

### Step 2: Update Email in Supabase

1. Go to Supabase Dashboard > Authentication > Users
2. Find your user
3. Click to edit
4. Change email to match your `ADMIN_EMAILS` config
5. Save changes

### Step 3: Update Environment Variable

Add your email to `.env`:

```env
ADMIN_EMAILS=your-email@example.com
```

Restart your dev server for changes to take effect.

## Verifying Admin Access

### Test Admin Login

1. Go to `/admin/login`
2. Login with admin credentials
3. You should see the Admin Dashboard with:
   - Statistics (Pending, Verified, Total developers)
   - List of pending developer verifications
   - List of verified developers

### Admin Capabilities

As an admin, you can:

✅ **Approve** new developer registrations

- Sets `is_verified = true`
- Profile becomes public on `/developers` page

❌ **Reject** developer registrations

- Deletes the developer profile
- User can re-register if needed

⚠️ **Revoke** verification from existing developers

- Sets `is_verified = false`
- Profile becomes hidden from public pages

## Security Notes

### Admin Authentication Flow

1. **Login**: Admin must authenticate via Supabase Auth
2. **Email Check**: Server validates email against `ADMIN_EMAILS` env variable
3. **Protected Routes**: `/admin/*` routes check authentication + admin status
4. **API Protection**: Admin API endpoints verify both auth session and admin email

### Environment Variable Security

- `ADMIN_EMAILS` should be **server-side only** (not prefixed with `PUBLIC_`)
- Never commit `.env` file to git
- Use different admin emails for dev/staging/production
- Rotate passwords regularly

### Recommended Setup

For production:

```env
# Use role-based email addresses
ADMIN_EMAILS=admin@dolphinder.io,security@dolphinder.io
```

For development:

```env
# Use personal emails for testing
ADMIN_EMAILS=dev1@example.com,dev2@example.com
```

## Troubleshooting

### "You do not have admin access" Error

**Cause**: Email doesn't match `ADMIN_EMAILS` configuration

**Solution**:

1. Check `.env` file for correct email
2. Verify no typos or extra spaces
3. Restart dev server after changing `.env`
4. Check that email in Supabase matches exactly

### Can't access `/admin/dashboard`

**Cause**: Not logged in or session expired

**Solution**:

1. Go to `/admin/login`
2. Sign in with admin credentials
3. Check browser cookies are enabled

### Changes to `ADMIN_EMAILS` not taking effect

**Cause**: Server needs restart to reload environment variables

**Solution**:

1. Stop dev server (Ctrl+C)
2. Restart with `pnpm dev`
3. Clear browser cache/cookies
4. Try logging in again

## Multiple Admins

You can have multiple admin accounts:

```env
ADMIN_EMAILS=admin1@domain.com,admin2@domain.com,admin3@domain.com
```

All admins have equal privileges:

- Approve/reject developer registrations
- Revoke existing verifications
- View all developers (pending and verified)

## Best Practices

1. **Use Strong Passwords**: Minimum 12 characters with mixed case, numbers, symbols
2. **Enable 2FA**: If Supabase supports it for your auth provider
3. **Audit Regularly**: Review developer approvals/rejections periodically
4. **Limit Admin Accounts**: Only give admin access to trusted team members
5. **Log Activities**: Monitor Supabase logs for suspicious admin actions
6. **Backup Data**: Regular backups of Supabase database
7. **Separate Environments**: Different admin emails for dev/prod

## Next Steps

After setting up admin access:

1. ✅ Test the admin dashboard
2. ✅ Run the migration script to import existing developers
3. ✅ Configure GitHub OAuth for user registration
4. ✅ Test the complete user registration flow
5. ✅ Verify developer approval workflow
