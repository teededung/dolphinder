# 📚 Documentation Index

Welcome to Dolphinder platform documentation! Choose the guide that fits your needs.

## 🚀 Getting Started

### For First-Time Setup

- **[QUICKSTART.md](./QUICKSTART.md)** ⭐ START HERE!
  - 10-minute setup guide
  - Step-by-step instructions
  - Perfect for new developers

### For Detailed Setup

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**
  - Comprehensive setup instructions
  - Troubleshooting tips
  - Environment configuration
  - Database migration details

## 👨‍💼 Admin Documentation

- **[ADMIN_SETUP.md](./ADMIN_SETUP.md)**
  - How to create admin accounts
  - Admin dashboard usage
  - Security best practices
  - Multiple admin management

## 👨‍💻 Developer Documentation

- **[DEV_NOTES.md](./DEV_NOTES.md)**
  - Development workflow
  - Code structure
  - Common tasks
  - Debugging tips
  - Useful commands

### I want to...

**...set up the project for the first time**
→ Read [QUICKSTART.md](./QUICKSTART.md)

**...integrate Walrus on-chain storage**
→ Read [WALRUS_INTEGRATION.md](./WALRUS_INTEGRATION.md)

**...become an admin**
→ Read [ADMIN_SETUP.md](./ADMIN_SETUP.md)

**...troubleshoot issues**
→ Read [SETUP_GUIDE.md](./SETUP_GUIDE.md) or [WALRUS_INTEGRATION.md](./WALRUS_INTEGRATION.md#troubleshooting)

## 📂 Technical Documentation

### Database Schema

- Located in: `supabase/migrations/001_initial_schema.sql`
- See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for details

### API Routes

- Authentication: `src/pages/api/auth/`
- Admin: `src/pages/api/admin/`
- Profile: `src/pages/api/profile/`

### Core Libraries

- Auth: `src/lib/auth.ts`
- Avatar: `src/lib/avatar.ts`
- Supabase: `src/lib/supabase/`

## 🎯 Feature Documentation

### User Features

- Registration with GitHub OAuth
- Profile editing
- Avatar upload
- Social links management

See [WEB2_IMPLEMENTATION.md](./WEB2_IMPLEMENTATION.md) for details.

### Admin Features

- Admin dashboard
- Developer verification
- Approve/reject/revoke

See [ADMIN_SETUP.md](./ADMIN_SETUP.md) for usage.

## 🔧 Configuration Files

- `env.example` - Environment variables template
- `package.json` - Scripts and dependencies
- `tsconfig.json` - TypeScript configuration
- `supabase/config.toml` - Supabase local config

## 📝 Code Examples

All documentation files contain inline code examples:

- Setup scripts in [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- API usage in [DEV_NOTES.md](./DEV_NOTES.md)
- SQL queries in migration files

## 🆘 Support

### Common Issues

Check the Troubleshooting sections in:

1. [SETUP_GUIDE.md](./SETUP_GUIDE.md#troubleshooting)
2. [ADMIN_SETUP.md](./ADMIN_SETUP.md#troubleshooting)
3. [DEV_NOTES.md](./DEV_NOTES.md#debugging)

### External Resources

- [Astro Documentation](https://docs.astro.build)
- [Supabase Documentation](https://supabase.com/docs)
- [GitHub OAuth Guide](https://docs.github.com/en/developers/apps/building-oauth-apps)

## 📅 Document Status

| Document                | Status      | Last Updated |
| ----------------------- | ----------- | ------------ |
| QUICKSTART.md           | ✅ Complete | 2025-10-29   |
| SETUP_GUIDE.md          | ✅ Complete | 2025-10-29   |
| ADMIN_SETUP.md          | ✅ Complete | 2025-10-26   |
| DEV_NOTES.md            | ✅ Complete | 2025-10-26   |
| DEPLOYMENT_CHECKLIST.md | ✅ Complete | 2025-10-26   |
| WALRUS_INTEGRATION.md   | ✅ Complete | 2025-10-29   |

## 🎓 Learning Path

### For New Team Members

1. Read [QUICKSTART.md](./QUICKSTART.md)
2. Follow setup instructions
3. Read [DEV_NOTES.md](./DEV_NOTES.md)
4. Explore codebase
5. Try making small changes

### For Admins

1. Read [QUICKSTART.md](./QUICKSTART.md)
2. Complete setup
3. Read [ADMIN_SETUP.md](./ADMIN_SETUP.md)
4. Create admin account
5. Test admin dashboard

### For DevOps/Deployment

1. Read [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. Read [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
3. Prepare production environment
4. Follow deployment steps
5. Monitor and maintain

## 🐋 Walrus Integration

- **[WALRUS_INTEGRATION.md](./WALRUS_INTEGRATION.md)** 🆕
  - On-chain storage with Walrus
  - Sui blockchain integration
  - Storage metadata & expiry
  - UI components & user flow
  - Troubleshooting guide

## 🔄 Updates

This documentation covers both Web2 and Walrus on-chain integration.

---

**Documentation Version**: 2.0
**Project Phase**: Web2 + Walrus Integration Complete
**Last Updated**: October 29, 2025
