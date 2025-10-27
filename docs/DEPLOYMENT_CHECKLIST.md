# Deployment Checklist

Checklist này giúp bạn deploy Dolphinder platform lên production.

## 📋 Pre-Deployment

### Supabase Setup

- [ ] Create Supabase production project
- [ ] Run database migration (`001_initial_schema.sql`)
- [ ] Verify RLS policies are enabled
- [ ] Note down production credentials
- [ ] Configure GitHub OAuth provider
- [ ] Set up custom domain (optional)

### GitHub OAuth

- [ ] Create production GitHub OAuth App
- [ ] Set production homepage URL
- [ ] Set production callback URL
- [ ] Copy Client ID and Secret
- [ ] Add credentials to Supabase dashboard

### Environment Variables

- [ ] Copy `env.example` to `.env`
- [ ] Set `PUBLIC_SUPABASE_URL` (production)
- [ ] Set `PUBLIC_SUPABASE_ANON_KEY` (production)
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` (production)
- [ ] Set `ADMIN_EMAILS` (production admin emails)
- [ ] Set `PUBLIC_ADMIN_EMAILS` (if needed for client)

### Data Migration

- [ ] Backup existing JSON data
- [ ] Run migration script: `pnpm migrate`
- [ ] Verify all developers imported
- [ ] Check avatars downloaded correctly
- [ ] Verify auth users created

## 🚀 Deployment

### Platform-Specific Steps

#### Netlify

```bash
# Build command
pnpm build

# Output directory
dist

# Environment variables
# Add all variables from .env in Netlify dashboard
```

#### Vercel

```bash
# Build command
pnpm build

# Output directory
dist

# Environment variables
# Add all variables from .env in Vercel dashboard
```

#### Custom Server

```bash
# Build
pnpm build

# Preview
pnpm preview

# Serve dist/ with your preferred server (nginx, apache, etc.)
```

### Post-Deployment Verification

- [ ] Visit production URL
- [ ] Test `/developers` page loads
- [ ] Test individual profile pages
- [ ] Test registration flow
- [ ] Test admin login
- [ ] Test admin dashboard
- [ ] Test profile editing
- [ ] Test avatar upload
- [ ] Check all images load
- [ ] Test on mobile devices

## 🔒 Security Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is server-side only
- [ ] Admin emails configured correctly
- [ ] RLS policies verified
- [ ] HTTPS enabled
- [ ] CORS configured properly
- [ ] Rate limiting enabled (if applicable)
- [ ] Error messages don't leak sensitive info
- [ ] Session timeout configured

## 📊 Monitoring Setup

- [ ] Enable Supabase logs monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure analytics (optional)
- [ ] Set up uptime monitoring
- [ ] Configure backup schedule
- [ ] Test backup restoration

## 🧪 Production Testing

### User Flows

- [ ] Register new account with GitHub
- [ ] Login existing account
- [ ] Edit profile
- [ ] Upload avatar
- [ ] View public profile
- [ ] Logout

### Admin Flows

- [ ] Admin login
- [ ] View pending developers
- [ ] Approve developer
- [ ] Reject developer
- [ ] Revoke verification
- [ ] Admin logout

### Edge Cases

- [ ] Try accessing admin dashboard as non-admin
- [ ] Try editing another user's profile
- [ ] Try uploading oversized avatar
- [ ] Try accessing unverified profile (not owner)
- [ ] Test with slow network
- [ ] Test on different browsers

## 📝 Post-Launch Tasks

### Immediate (Day 1)

- [ ] Create first admin account
- [ ] Test full registration flow
- [ ] Verify email notifications (if any)
- [ ] Check all links work
- [ ] Monitor error logs

### Short-term (Week 1)

- [ ] Review and approve pending developers
- [ ] Monitor database performance
- [ ] Check image loading times
- [ ] Gather user feedback
- [ ] Fix any reported bugs

### Medium-term (Month 1)

- [ ] Review admin logs
- [ ] Optimize database queries if needed
- [ ] Clean up unused avatars
- [ ] Review and update documentation
- [ ] Plan next features (on-chain phase)

## 🐛 Rollback Plan

If issues occur after deployment:

1. **Immediate Rollback**
   - Revert to previous deployment
   - Use platform's rollback feature

2. **Database Issues**
   - Restore from Supabase backup
   - Re-run migration if needed

3. **Auth Issues**
   - Check GitHub OAuth settings
   - Verify Supabase Auth config
   - Check environment variables

4. **Communication**
   - Notify users of downtime
   - Post status updates
   - Provide estimated fix time

## 📞 Support Contacts

- **Supabase Support**: https://supabase.com/support
- **GitHub Support**: https://support.github.com
- **Your hosting platform support**

## ✅ Final Checks

Before marking as complete:

- [ ] All checklist items completed
- [ ] No critical errors in logs
- [ ] Performance is acceptable
- [ ] All features working as expected
- [ ] Documentation is up to date
- [ ] Team trained on admin functions
- [ ] Backup schedule confirmed
- [ ] Monitoring alerts configured

---

**Deployment Date**: ******\_\_\_******
**Deployed By**: ******\_\_\_******
**Production URL**: ******\_\_\_******
**Supabase Project**: ******\_\_\_******
**Status**: ⬜ Pending / ✅ Complete
