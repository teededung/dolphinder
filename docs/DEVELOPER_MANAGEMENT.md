# 🐬 Developer Management System

Hệ thống quản lý developer profiles đã được cải tiến để dễ scale và maintain hơn.

## 📁 Cấu trúc

```
src/data/
├── developers/          # Thư mục chứa JSON files của từng developer
│   ├── hulk.json
│   ├── hieudepoet.json
│   └── ...
└── loadDevs.ts         # Utility functions để load developer data
```

## ✨ Ưu điểm của hệ thống

- 🎯 **Dễ quản lý**: Mỗi developer có 1 file riêng
- 🔍 **Dễ tìm kiếm**: Tìm theo username ngay trong tên file
- ✅ **Validation**: Tự động validate JSON schema với Zod
- 🚀 **Dễ scale**: Thêm 100+ developers không vấn đề gì
- 🔧 **Tools hỗ trợ**: Scripts tự động để thêm/validate
- 📱 **Migration friendly**: JSON dễ migrate sang database/API sau này

## 🛠️ Cách sử dụng

### 1. Thêm developer mới

```bash
# Tạo template cho developer mới
pnpm run dev:add <username>

# Ví dụ:
pnpm run dev:add john-doe
```

Sau đó edit file `src/data/developers/john-doe.json`:

```json
{
  "name": "John Doe",
  "username": "john-doe",
  "avatar": "/avatar/john-doe.jpg",
  "github": "https://github.com/john-doe",
  "linkedin": "https://www.linkedin.com/in/john-doe",
  "website": "https://johndoe.dev",
  "bio": "Full-stack developer passionate about Web3",
  "slushWallet": "0x..."
}
```

### 2. Liệt kê tất cả developers

```bash
pnpm run dev:list
```

### 3. Validate developer profiles

```bash
# Validate tất cả
pnpm run dev:validate

# Validate file cụ thể
pnpm run dev:validate john-doe.json
```

### 4. Build và deploy

```bash
pnpm build
```

Astro sẽ tự động generate static pages cho tất cả developers.

## 📋 Schema

Mỗi developer profile phải có cấu trúc sau:

```typescript
type Dev = {
  name: string; // Tên đầy đủ (bắt buộc)
  username: string; // Username unique (bắt buộc)
  avatar?: string; // URL/path to avatar
  github: string; // GitHub URL (bắt buộc)
  linkedin?: string; // LinkedIn URL
  website?: string; // Personal website
  bio?: string; // Mô tả ngắn
  slushWallet?: string; // Sui wallet address
};
```

## 🔧 Advanced Usage

### Programmatic Access

```typescript
import { loadDevelopers, getDeveloperByUsername } from "./src/data/loadDevs";

// Load tất cả developers
const allDevs = await loadDevelopers();

// Load developer cụ thể
const dev = await getDeveloperByUsername("hulk");
```

### Custom Validation

File `loadDevs.ts` sử dụng Zod schema để validate. Bạn có thể customize schema nếu cần:

```typescript
const DevSchema = z.object({
  name: z.string(),
  username: z.string(),
  // ... thêm validation rules
});
```

## 🚀 Migration Path

Hệ thống JSON này dễ dàng migrate sang:

1. **Database**: Import JSON vào MongoDB/PostgreSQL
2. **Headless CMS**: Import vào Strapi/Contentful
3. **API**: Tạo REST/GraphQL API từ JSON data
4. **Git-based CMS**: Dùng với NetlifyCMS/ForestryIO

## 🎯 Best Practices

1. **File naming**: Dùng username làm tên file
2. **Avatar**: Upload vào `/public/avatar/` hoặc dùng external URL
3. **Validation**: Luôn chạy `pnpm run dev:validate` trước khi commit
4. **Consistent data**: Đảm bảo format URL và data nhất quán
5. **Backup**: JSON files dễ backup và version control

---

Bây giờ việc thêm developer mới chỉ cần tạo 1 file JSON và build lại! 🎉
