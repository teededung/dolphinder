<!-- 4793d808-3e5e-4408-8c85-eb8b03d6e285 cf4e799e-efb1-42ca-9e31-32962f559016 -->
# Plan: Web2 Developer Platform với Supabase

## 1) Supabase Schema

Tạo file migration SQL (`supabase/migrations/001_initial_schema.sql`):

**Table: developers**

- `id` (uuid, primary key, default gen_random_uuid())
- `user_id` (uuid, foreign key → auth.users, unique) - liên kết với Supabase Auth
- `username` (text, unique, not null) - username hiển thị
- `name` (text, not null)
- `avatar` (text) - path tới file trong public/avatar/
- `github` (text) - GitHub profile URL
- `linkedin` (text)
- `telegram` (text)
- `bio` (text)
- `slush_wallet` (text) - Sui wallet address
- `entry` (text) - level/role của developer
- `is_verified` (boolean, default false) - admin verification status
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

**RLS Policies:**

- Public read access cho developers đã verified
- User chỉ update được profile của chính mình
- Admin có thể update `is_verified`

## 2) Environment Variables

Thêm vào `.env`:

```
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # cho admin operations
ADMIN_EMAILS=admin@example.com,admin2@example.com # danh sách admin
```

## 3) Migration Script

File: `scripts/migrate-json-to-supabase.ts`

Luồng:

1. Đọc tất cả files trong `src/data/developers/*.json`
2. Với mỗi developer:

   - Nếu avatar là URL external → tải về `public/avatar/{username}-avatar.{ext}`
   - Nếu avatar đã là local path → giữ nguyên

3. Tạo user trong auth.users (dùng service role key):

   - email tạm: `{username}@dolphinder.local`
   - password random (user sẽ login qua GitHub sau)

4. Insert vào `developers` table với `is_verified=true` (vì là data cũ đã xác thực)

## 4) GitHub OAuth Setup

**File: `src/pages/api/auth/callback.ts`**

- Xử lý GitHub OAuth callback từ Supabase
- Sau khi auth thành công:
  - Lấy thông tin GitHub user (username, name, avatar)
  - Check xem `developers` table đã có user_id chưa
  - Nếu chưa → tạo record mới với `is_verified=false`
  - Redirect về dashboard hoặc profile

**Supabase Dashboard Config:**

- Enable GitHub provider
- Set redirect URL: `https://your-domain.com/api/auth/callback`

## 5) Auth Utils

File: `src/lib/auth.ts`

- `getCurrentUser()` → lấy session từ Supabase
- `isAdmin(email: string)` → check email có trong `ADMIN_EMAILS`
- `getDeveloperProfile(userId)` → query developers table by user_id

## 6) Admin Dashboard

**File: `src/pages/admin/dashboard.astro`**

- Protected route: check `isAdmin(user.email)`
- Nếu chưa login → redirect `/admin/login`
- Nếu không phải admin → show 403

**Component: `src/components/admin/DeveloperList.tsx`**

- Hiển thị danh sách developers chờ verify (`is_verified=false`)
- Button approve/reject
- Filter, search theo username/name

**File: `src/pages/admin/login.astro`**

- Form login Supabase Auth (email/password)
- Chỉ admin emails mới login được (check sau khi auth)

## 7) User Registration Flow

**File: `src/pages/register.astro`**

- Button "Sign in with GitHub"
- Gọi `supabase.auth.signInWithOAuth({ provider: 'github' })`

**Auto-create profile:**

- Trong callback (hoặc dùng Database Trigger):
  - Lấy GitHub metadata từ `auth.users.raw_user_meta_data`
  - Tạo record trong `developers`:
    - `username` = GitHub username
    - `name` = GitHub display name
    - `avatar` = tải GitHub avatar về local, lưu path
    - `github` = GitHub profile URL
    - `is_verified` = false

## 8) User Profile Edit

**File: `src/pages/dashboard.astro`**

- Protected route (user phải login)
- Load developer profile của user hiện tại

**Component: `src/components/profile/ProfileEditForm.tsx`**

- Form với các field: name, bio, github, linkedin, telegram, slush_wallet, entry
- Upload avatar (file input):
  - Client upload file → save vào `public/avatar/{username}-{timestamp}.{ext}`
  - Update `avatar` field trong DB
- Submit → update `developers` table qua API route

**File: `src/pages/api/profile/update.ts`**

- Verify user ownership (user chỉ edit profile của mình)
- Validate input
- Update DB, set `updated_at`

## 9) Avatar Handling

**Util: `src/lib/avatar.ts`**

- `downloadAvatar(url, username) → Promise<string>` - tải avatar từ URL, lưu vào public/avatar/, trả về local path
- `uploadAvatar(file, username) → Promise<string>` - save uploaded file, trả về path
- `deleteOldAvatar(path)` - xóa avatar cũ khi update

## 10) Public Profile Page Update

**File: `src/pages/[username]/index.astro`**

- Query developer từ Supabase theo username
- Fallback về JSON nếu không tìm thấy trong DB (tương thích ngược)
- Chỉ hiển thị profile nếu `is_verified=true` hoặc là chính user đó

## 11) Developers Listing Page

**File: `src/pages/developers.astro`**

- Query tất cả developers có `is_verified=true` từ Supabase
- Merge với dữ liệu JSON (nếu cần fallback)
- Render bubble UI như hiện tại

## 12) API Routes Summary

- `/api/auth/callback` - GitHub OAuth callback
- `/api/profile/update` - User update profile
- `/api/admin/verify` - Admin approve/reject developer
- `/api/profile/avatar/upload` - Upload avatar image

## Todos

- Setup Supabase schema với migration SQL
- Viết migration script import JSON → Supabase (bao gồm download avatars)
- Config GitHub OAuth trong Supabase dashboard
- Tạo auth utils (getCurrentUser, isAdmin, getDeveloperProfile)
- Tạo admin login page và dashboard
- Tạo admin verification UI (DeveloperList component)
- Tạo user registration page (GitHub OAuth button)
- Xử lý auto-create profile sau GitHub OAuth
- Tạo user dashboard và ProfileEditForm
- Implement avatar upload/download utils
- Tạo API route update profile
- Tạo API route admin verify
- Update public profile page query từ Supabase
- Update developers listing page query từ Supabase

### To-dos

- [ ] Setup Supabase schema với migration SQL (developers table, RLS policies)
- [ ] Viết migration script import JSON → Supabase (bao gồm download avatars)
- [ ] Config GitHub OAuth trong Supabase dashboard và environment variables
- [ ] Tạo auth utils (getCurrentUser, isAdmin, getDeveloperProfile)
- [ ] Tạo admin login page và protected dashboard route
- [ ] Tạo admin verification UI và API (DeveloperList component, approve/reject)
- [ ] Tạo user registration page với GitHub OAuth button
- [ ] Xử lý auto-create profile sau GitHub OAuth callback
- [ ] Implement avatar upload/download/delete utils
- [ ] Tạo user dashboard, ProfileEditForm và API route update profile
- [ ] Update public profile page query từ Supabase với fallback JSON
- [ ] Update developers listing page query từ Supabase