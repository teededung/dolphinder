# Development Notes

Quick notes cho developers khi làm việc với Dolphinder platform.

## 🚀 Quick Start (Development)

```bash
# Install dependencies
pnpm install

# Copy environment template
cp env.example .env

# Fill in .env with your Supabase credentials
# PUBLIC_SUPABASE_URL=...
# PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...
# ADMIN_EMAILS=your-email@example.com

# Start dev server
pnpm dev
```

## 📁 Project Structure

```
src/
├── lib/
│   ├── auth.ts                 # Authentication helpers
│   ├── avatar.ts               # Avatar upload/download
│   ├── supabase/              # Supabase clients
│   └── utils.ts               # General utilities
│
├── pages/
│   ├── admin/                 # Admin pages (protected)
│   ├── api/                   # API routes
│   ├── [username]/            # Dynamic profile pages
│   ├── dashboard.astro        # User dashboard
│   ├── developers.astro       # Developers listing
│   └── register.astro         # Registration
│
├── components/
│   ├── admin/                 # Admin components (future)
│   ├── profile/               # Profile components (future)
│   └── shared/                # Shared components
│
└── types/
    └── astro.d.ts             # TypeScript declarations
```

## 🔑 Key Concepts

### Authentication Flow

1. **User Login/Register**
   - GitHub OAuth via Supabase
   - Auto-create profile on first login
   - Session stored in cookies

2. **Protected Routes**
   - Check session with `getCurrentUser()`
   - Admin routes check `isAdmin(email)`
   - Redirect to login if unauthorized

3. **RLS (Row Level Security)**
   - Database-level security
   - Users can only update own profile
   - Public can only read verified developers

### Data Flow

```
JSON Files (legacy)
    ↓
Migration Script
    ↓
Supabase Database
    ↓
Astro Pages/API
    ↓
User Interface
```

## 🧩 Common Tasks

### Add a New Developer Field

1. **Update Database Schema**

   ```sql
   ALTER TABLE developers ADD COLUMN new_field TEXT;
   ```

2. **Update TypeScript Types**

   ```typescript
   // src/lib/auth.ts
   export interface Developer {
     // ... existing fields
     new_field: string | null;
   }
   ```

3. **Update Forms**
   - Edit form in `src/pages/dashboard.astro`
   - Add input field
   - Handle in API route

4. **Update Displays**
   - Profile page
   - Developer cards
   - Admin dashboard

### Create Protected Page

```astro
---
// src/pages/protected-page.astro
import { createSupabaseServerClient } from "../lib/supabase/serverClient";
import { getCurrentUser } from "../lib/auth";

export const prerender = false;

const supabase = createSupabaseServerClient(Astro.cookies as any);
const user = await getCurrentUser(supabase);

if (!user) {
  return Astro.redirect("/register");
}
---

<div>Protected content for {user.email}</div>
```

### Create API Route

```typescript
// src/pages/api/my-endpoint.ts
import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../lib/supabase/serverClient";
import { getCurrentUser } from "../../lib/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies as any);
  const user = await getCurrentUser(supabase);

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // Your logic here

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
```

## 🐛 Debugging

### Common Issues

**1. "Missing Supabase credentials"**

- Check `.env` file exists
- Verify all required env vars are set
- Restart dev server

**2. "User not found"**

- Check user exists in Supabase Auth
- Verify session is valid
- Clear browser cookies and re-login

**3. "Permission denied" (RLS)**

- Check RLS policies in Supabase
- Verify user_id matches auth.uid()
- Check is_verified status

**4. "Avatar upload failed"**

- Check file size (max 5MB)
- Verify public/avatar/ directory exists
- Check file type is supported

### Debug Tools

```typescript
// Add to any Astro page for debugging
---
const supabase = createSupabaseServerClient(Astro.cookies as any);
const user = await getCurrentUser(supabase);
console.log('Current user:', user);
---
```

```typescript
// Add to any API route
console.log("Request body:", await request.json());
console.log("User:", user);
```

## 📝 Code Style

### TypeScript

- Use strict types
- Prefer interfaces over types for objects
- Add JSDoc comments for exported functions

### Astro Components

- Use `prerender = false` for dynamic pages
- Server-side validation for security
- Client-side validation for UX

### React Components

- Use TypeScript
- Prefer function components
- Use hooks for state management

## 🧪 Testing

### Manual Testing

**Test User Registration:**

1. Go to `/register`
2. Click GitHub OAuth
3. Complete OAuth flow
4. Check profile created
5. Verify avatar downloaded

**Test Admin Functions:**

1. Login as admin at `/admin/login`
2. View pending developers
3. Approve one developer
4. Check they appear in `/developers`
5. Test revoke function

**Test Profile Edit:**

1. Login as user
2. Go to `/dashboard`
3. Edit all fields
4. Upload new avatar
5. Save changes
6. View public profile

## 🔧 Useful Commands

```bash
# Development
pnpm dev                          # Start dev server
pnpm build                        # Build for production
pnpm preview                      # Preview production build

# Database
pnpm migrate                      # Run migration script
supabase db push                  # Push migrations to Supabase

# Code Quality
pnpm format                       # Format code with Prettier
pnpm format:check                 # Check code formatting

# Developer Management (legacy)
pnpm dev:add                      # Add developer to JSON
pnpm dev:list                     # List developers
pnpm dev:validate                 # Validate JSON files
```

## 📚 Resources

- [Astro Docs](https://docs.astro.build)
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [GitHub OAuth](https://docs.github.com/en/developers/apps/building-oauth-apps)

## 🎯 Next Steps (On-chain Phase)

Future implementation will include:

- Walrus storage integration
- On-chain profile verification
- Sui blockchain connection
- Smart contracts
- NFT certificates

These are currently out of scope for the Web2 phase.

## 💡 Tips

1. **Always test locally first** before deploying
2. **Check Supabase logs** for database errors
3. **Use browser DevTools** for client-side debugging
4. **Monitor terminal output** for server-side errors
5. **Keep backups** before major changes
6. **Test RLS policies** in Supabase SQL Editor
7. **Clear cookies** if auth seems broken
8. **Restart dev server** after .env changes

---

Happy coding! 🚀
