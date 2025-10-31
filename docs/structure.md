.
├── README.md
├── astro.config.mjs
├── components.json
├── docs
│   ├── ADMIN_SETUP.md
│   ├── QUICKSTART.md
│   ├── SETUP_GUIDE.md
│   ├── UNBIND_WALLET_FLOW.md
│   └── WALRUS_INTEGRATION.md
├── package.json
├── pnpm-lock.yaml
├── public
│   ├── avatar
│   ├── dolphinder-logo.png
│   ├── favicon.svg
│   ├── sui-sui-logo.svg
│   ├── walrus-token.svg
│   └── walrus.svg
├── scripts
│   ├── add-developer.js
│   ├── import-json-to-supabase.ts
│   ├── import-single-developer.js
│   ├── migrate-avatars.ts
│   ├── push-migration.sh
│   └── seed_onchain.ts
├── src
│   ├── assets
│   ├── components
│   ├── data
│   ├── lib
│   ├── pages
│   ├── store
│   ├── styles
│   └── types
├── structure.md
├── supabase
│ ├── config.toml
│ └── migrations
└── tsconfig.json

---

## 📋 Tóm tắt Cấu trúc Dự án

### 🎯 Tổng quan

**Dolphinder** là một ứng dụng web xây dựng trên **Astro** + **React** + **TypeScript**, cho phép developers tạo và quản lý hồ sơ on-chain trên blockchain Sui. Dự án tích hợp với **Supabase** cho authentication và database, sử dụng **Walrus** cho permanent storage, và hỗ trợ **Sponsored Transactions** để người dùng không cần SUI trong ví.

### 📁 Chi tiết Cấu trúc

#### **Root Level**

- `README.md` - Tài liệu chính của dự án, mô tả mục tiêu và hướng dẫn
- `astro.config.mjs` - Cấu hình Astro framework
- `components.json` - Cấu hình cho UI components (shadcn/ui)
- `package.json` - Dependencies và scripts của dự án
- `tsconfig.json` - Cấu hình TypeScript

#### **📚 `docs/` - Tài liệu**

Chứa tất cả tài liệu hướng dẫn và mô tả:

- `QUICKSTART.md` - Hướng dẫn bắt đầu nhanh
- `SETUP_GUIDE.md` - Hướng dẫn setup chi tiết
- `ADMIN_SETUP.md` - Hướng dẫn setup cho admin
- `WALRUS_INTEGRATION.md` - Tài liệu tích hợp Walrus storage
- `UNBIND_WALLET_FLOW.md` - Tài liệu về flow unbind wallet

#### **📦 `public/` - Static Assets**

Thư mục chứa các file tĩnh được serve trực tiếp:

- `avatar/` - Thư mục chứa avatar của các developers
- `*.png`, `*.svg` - Logo và icons của dự án (dolphinder, sui, walrus)

#### **🔧 `scripts/` - Utility Scripts**

Các script tiện ích cho development và migration:

- `add-developer.js` - Thêm developer mới
- `import-json-to-supabase.ts` - Import dữ liệu từ JSON vào Supabase
- `import-single-developer.js` - Import một developer đơn lẻ
- `migrate-avatars.ts` - Migration avatars
- `push-migration.sh` - Push database migrations
- `seed_onchain.ts` - Seed dữ liệu on-chain

#### **💻 `src/` - Source Code Chính**

##### **`src/assets/`**

Assets được import và xử lý bởi Astro build process.

##### **`src/components/` - React Components**

Tổ chức theo chức năng:

- **`admin/`** - Components cho admin dashboard
  - `ActionButton.tsx` - Button thao tác admin

- **`common/`** - Components dùng chung
  - `ConnectBtn.tsx` - Button kết nối wallet

- **`dashboard/`** - Components cho dashboard page
  - `CompareWalrusModal.tsx` - Modal so sánh Walrus storage
  - `EditableAvatar.tsx` - Avatar có thể chỉnh sửa
  - `WalrusStorageInfo.tsx` - Hiển thị thông tin Walrus storage

- **`onchain/`** - Components xử lý on-chain data
  - `DashboardClient.tsx` - Client component cho dashboard
  - `OnchainProfile.tsx` - Profile on-chain
  - `OnchainProfileForm.tsx` - Form chỉnh sửa profile on-chain
  - `ProjectForm.tsx` - Form thêm/chỉnh sửa project
  - `CertificateForm.tsx` - Form thêm/chỉnh sửa certificate
  - `VerifyForm.tsx` - Form verification

- **`providers/`** - React Context Providers
  - `SuiProvider.tsx` - Sui wallet provider
  - `GlobalSuiProvider.tsx` - Global Sui provider wrapper

- **`shared/`** - Shared UI components
  - Profile components: `ProfileCard.tsx`, `ProfileForm.tsx`, `ProfileAvatar.tsx`
  - Auth components: `LoginForm.tsx`, `LogoutButton.tsx`, `OAuthButton.tsx`
  - UI utilities: `Button.tsx`, `CopyButton.tsx`, `DialogStored.tsx`
  - Modals: `AvatarEditModal.tsx`, `UnbindWarningModal.tsx`

- **`ui/`** - Base UI components (shadcn/ui)
  Các components cơ bản như `button`, `dialog`, `input`, `avatar`, `badge`, v.v.

- **`react-bits/`** - Special React components
  - `Silk.tsx` - Component đặc biệt (3D/visual effect)

- **`debug/`** - Debug components
  - `WalrusBlobDebug.tsx` - Debug tool cho Walrus blob

##### **`src/pages/` - Astro Pages (Routing)**

Các file trong `pages/` tạo routes tự động:

- **Static pages:**
  - `index.astro` - Trang chủ, hiển thị danh sách developers
  - `community.astro` - Trang community
  - `developers.astro` - Trang danh sách developers
  - `showcase.astro` - Showcase page
  - `learn.astro` - Learning page
  - `dashboard.astro` - Dashboard page
  - `login.astro`, `register.astro` - Auth pages

- **Dynamic routes:**
  - `[username]/index.astro` - Profile page theo username

- **Admin routes:**
  - `admin/dashboard.astro` - Admin dashboard
  - `admin/login.astro` - Admin login
  - `admin/verify.astro` - Admin verification page

- **API routes (`api/`):**
  - `auth/` - Authentication endpoints (login, logout, callback, session-sync)
  - `admin/verify.ts` - Admin verification API
  - `dashboard/upload-avatar.ts` - Upload avatar API
  - `profile/` - Profile management APIs
  - `developers/list.ts` - Get developers list API
  - `sponsor/execute.ts` - Sponsored transaction execution
  - `supabase/health.ts` - Supabase health check

##### **`src/lib/` - Utilities & Helpers**

Thư viện tiện ích và helper functions:

- **Blockchain:**
  - `sui-tx.ts` - Sui transaction utilities
  - `sui-views.ts` - Sui view functions
  - `blockchain-utils.ts` - Blockchain helper functions
  - `walrus.ts` - Walrus storage client
  - `walrus-metadata.ts` - Walrus metadata handling

- **Supabase:**
  - `supabase/browserClient.ts` - Supabase client cho browser
  - `supabase/serverClient.ts` - Supabase client cho server

- **Utilities:**
  - `auth.ts` - Authentication utilities
  - `media-upload.ts` - Avatar and project image upload handling
  - `utils.ts` - General utilities

##### **`src/data/`**

- `developers/` - JSON files chứa dữ liệu developers (static data)
- `loadDevs.ts` - Load developers data, có export type của dev.

##### **`src/store/`**

- `useModalStore.ts` - Zustand store cho modal management

##### **`src/styles/`**

- `global.css` - Global styles, Tailwind imports

##### **`src/types/`**

- `astro.d.ts` - Type definitions cho Astro

#### **🗄️ `supabase/` - Database**

- `config.toml` - Supabase configuration
- `migrations/` - Database migration files
  - `001_complete_schema.sql` - Complete schema (consolidated from all previous migrations)

### 🔄 Luồng Dữ Liệu

1. **Authentication Flow:** User login qua Supabase Auth → Session được sync → Wallet kết nối
2. **Profile Creation:** User tạo profile → Data lưu vào Supabase → Avatar upload lên Walrus → On-chain data được publish lên Sui
3. **Sponsored Transactions:** User gửi transaction → API sponsor xử lý → Transaction được execute không cần SUI
4. **Display:** Frontend query từ Supabase + Sui blockchain → Render profile, projects, certificates

### 🛠️ Tech Stack

- **Framework:** Astro 5.x (SSR + Static)
- **UI:** React 19 + Tailwind CSS 4
- **Blockchain:** Sui SDK (@mysten/sui, @mysten/dapp-kit)
- **Storage:** Walrus (@mysten/walrus)
- **Database:** Supabase (PostgreSQL)
- **State Management:** Zustand
- **UI Components:** Radix UI + shadcn/ui
- **Package Manager:** pnpm
