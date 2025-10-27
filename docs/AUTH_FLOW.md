# Authentication Flow

## Pages Overview

### Public Pages

- `/` - Homepage
- `/community` - Community page
- `/showcase` - Showcase page
- `/learn` - Learn page

### Authentication Pages

- `/login` - User login (email/password)
- `/register` - User registration (GitHub OAuth)
- `/admin/login` - Admin login (email/password only)

### Protected Pages

- `/dashboard` - User dashboard (requires authentication + developer profile)
- `/admin/dashboard` - Admin dashboard (requires authentication + admin role)
- `/[username]` - User profile page (public)

## Authentication Flow

### User Registration Flow

```
1. User visits /register
2. Click "Continue with GitHub"
3. OAuth redirect to GitHub
4. GitHub callback → /api/auth/callback
5. Create user account + developer profile
6. Redirect to /dashboard?welcome=true
```

### User Login Flow

```
1. User visits /login
2. Enter email + password
3. POST /api/auth/login
4. Session saved in cookies
5. Redirect to /dashboard
```

### Admin Login Flow

```
1. Admin visits /admin/login
2. Enter email + password
3. POST /api/auth/login
4. Session saved in cookies
5. Check if email in ADMIN_EMAILS
6. If admin → redirect to /admin/dashboard
7. If not admin → 403 Forbidden
```

### Logout Flow

```
1. User clicks Logout button
2. POST /api/auth/logout
3. Clear session cookies
4. Redirect to /login (or /admin/login for admin)
```

## Protected Routes

### `/dashboard` Protection

```typescript
const user = await getCurrentUser(supabase);

if (!user) {
  return Astro.redirect("/login");
}

const developer = await getDeveloperProfile(supabase, user.id);

if (!developer) {
  return Astro.redirect("/register");
}
```

### `/admin/dashboard` Protection

```typescript
const user = await getCurrentUser(supabase);

if (!user) {
  return Astro.redirect("/admin/login");
}

if (!isAdmin(user.email)) {
  return new Response("Forbidden", { status: 403 });
}
```

## API Routes

### `POST /api/auth/login`

- Input: `{ email, password }`
- Output: `{ success: true, user: {...} }`
- Sets session cookies via `createSupabaseServerClient`

### `POST /api/auth/logout`

- Input: None
- Output: `{ success: true }`
- Clears session cookies

### `GET /api/auth/callback`

- OAuth callback handler
- Exchanges code for session
- Creates developer profile if new user
- Redirects to `/dashboard?welcome=true`

## Environment Variables

```bash
# Supabase
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Admin emails (comma-separated)
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

## Security Notes

1. **Server-side session validation**: Uses `getUser()` instead of `getSession()` for security
2. **Cookie-based sessions**: Session stored in HTTP-only cookies, not localStorage
3. **Admin role check**: Server-side validation using `ADMIN_EMAILS` env variable
4. **Protected API routes**: All API routes have `export const prerender = false`

## Components

### React Components

- `LoginForm` - Email/password login form
- `RegisterForm` - GitHub OAuth registration
- `LogoutButton` - Logout button with API call

### Layouts

- `MainLayout` - Main layout with React App wrapper
- Used by all pages for consistent styling

## Session Management

Sessions are managed via Supabase Auth:

- **Client-side**: `getSupabaseBrowserClient()` - for OAuth and initial login
- **Server-side**: `createSupabaseServerClient(cookies)` - for protected routes
- **Storage**: HTTP-only cookies (secure, not accessible via JavaScript)
