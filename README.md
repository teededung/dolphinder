# 🐬 Dolphinder

**Nền tảng hồ sơ developer on-chain đầu tiên trên Sui blockchain**

Dolphinder là một nền tảng cho phép các developer tạo và quản lý hồ sơ chuyên nghiệp của mình trực tiếp trên blockchain Sui. Với sự tích hợp của Walrus - hệ thống lưu trữ phi tập trung vĩnh viễn, và Supabase cho trải nghiệm Web2 mượt mà, Dolphinder mang đến giải pháp hybrid độc đáo kết hợp sự tiện lợi của Web2 với tính minh bạch và bất biến của Web3.

---

## 🎯 Giới thiệu

Dolphinder cho phép developers:

- ✅ **Tạo hồ sơ on-chain** với thông tin cá nhân, bio, và liên kết mạng xã hội
- ✅ **Showcase dự án** với hình ảnh, mô tả và demo links
- ✅ **Đăng chứng chỉ** và thành tích chuyên nghiệp
- ✅ **Xác thực danh tính** qua hệ thống admin verification
- ✅ **Lưu trữ vĩnh viễn** trên Walrus blockchain storage
- ✅ **Không cần gas fee** nhờ Sponsored Transactions

---

## 🏗️ Kiến trúc Hybrid Web2 + Web3

Dolphinder sử dụng kiến trúc hybrid thông minh:

### **Web2 Layer (Supabase)**

- **Authentication**: Đăng nhập/đăng ký qua GitHub OAuth
- **Database**: Lưu trữ profile data, projects, certificates
- **Storage**: Tùy chọn lưu project images trên Supabase Storage
- **Ưu điểm**: Tốc độ nhanh, trải nghiệm mượt mà, không cần wallet

### **Web3 Layer (Walrus + Sui)**

- **Blockchain Storage**: Profile data được lưu trên Walrus blockchain
- **Smart Contract**: Reference đến Walrus blob được ghi trên Sui blockchain
- **Verification**: Có thể verify và xác thực dữ liệu trực tiếp từ blockchain
- **Ưu điểm**: Bất biến, phi tập trung, có thể kiểm chứng công khai

### **Cơ chế hoạt động**

1. User tạo/cập nhật profile → Lưu vào Supabase ngay lập tức (off-chain)
2. User chọn "Push to Walrus" → Hệ thống upload JSON lên Walrus blockchain
3. Smart contract trên Sui lưu reference (blob ID) → Profile trở thành on-chain
4. Frontend load dữ liệu từ cả Supabase và blockchain để hiển thị

---

## 🧊 Lưu trữ On-chain với Walrus

### Tổng quan về Walrus Storage

Walrus là hệ thống lưu trữ phi tập trung vĩnh viễn được thiết kế đặc biệt cho blockchain. Dolphinder sử dụng Walrus để lưu trữ toàn bộ profile data (bao gồm profile info, projects, và certificates) dưới dạng JSON blob bất biến.

### Quy trình lưu trữ On-chain

#### **Bước 1: Chuẩn bị dữ liệu**

Developer điền thông tin profile, thêm projects với hình ảnh, và certificates trên dashboard. Tất cả dữ liệu được lưu tạm thời trên Supabase.

#### **Bước 2: Upload JSON lên Walrus**

Khi developer chọn "Push to Walrus", hệ thống sẽ:

- **Đóng gói toàn bộ profile** thành một JSON object chứa:
  - Profile information (name, bio, social links, avatar URL)
  - Projects array (mỗi project có images, description, links)
  - Certificates array (certificate details và images)
- **Upload JSON lên Walrus Publisher** qua API endpoint
- **Nhận về blob ID** (content hash) và blob object ID (Sui object reference)

#### **Bước 3: Ghi lên Sui Blockchain**

- **Tạo transaction** trên Sui smart contract với:
  - Username (unique identifier)
  - Walrus blob ID (reference đến profile data)
- **Sign transaction** qua Sui wallet (có thể dùng Sponsored Transactions để không tốn gas)
- **Blob ID được lưu** trên smart contract, liên kết với developer's wallet address

#### **Bước 4: Cache metadata**

- **Lưu blob ID và object ID** vào Supabase database để truy vấn nhanh
- Profile hiện hiển thị badge "On-chain" và thông tin storage metadata

### Lưu trữ Project Images

#### **Option 1: Supabase Storage (Off-chain)**

- Images được upload trực tiếp lên Supabase Storage bucket
- Path format: `{userId}/{projectId}-{timestamp}.{ext}`
- Ưu điểm: Upload nhanh, chi phí thấp, dễ quản lý
- Nhược điểm: Phụ thuộc vào Supabase infrastructure

#### **Option 2: Walrus Quilt (On-chain)**

- Nhiều images được đóng gói thành một **Quilt** (tối đa 666 images)
- Tất cả project images của developer được upload trong **1 transaction duy nhất**
- Mỗi image được gán một unique identifier (patchId) trong quilt
- URL format: `{aggregator_url}/v1/quilts/{quiltId}/{patchId}`
- **Ưu điểm**:
  - Atomic upload (all-or-nothing)
  - Lưu trữ vĩnh viễn trên blockchain
  - Data locality (tất cả images cùng một developer ở cùng một nơi)
  - Đơn giản hóa state management (chỉ cần track 1 quiltId thay vì nhiều blobIds)

### Metadata và Expiry

Mỗi blob trên Walrus có metadata bao gồm:

- **Registered Epoch**: Epoch mà blob được đăng ký
- **Certified Epoch**: Epoch mà blob được chứng nhận
- **Storage Period**:
  - Start epoch và End epoch
  - Duration tính bằng epochs (1 epoch ≈ 1 ngày trên testnet)
- **Storage Size**: Kích thước dữ liệu tính bằng bytes/KB

Profile có thể **hết hạn** sau khi storage period kết thúc. Developer cần re-push profile lên Walrus để gia hạn storage.

### Verification và Transparency

Sau khi profile được push on-chain:

- **Smart Contract Link**: Có thể xem transaction trên Suiscan explorer
- **Blob Metadata Link**: Xem thông tin storage trên Suiscan
- **Download JSON**: Tải về profile data gốc từ Walrus Aggregator
- **Public Verification**: Bất kỳ ai cũng có thể verify profile data trực tiếp từ blockchain

---

## ✨ Tính năng chính

### 👤 Developer Profiles

- Tạo hồ sơ với thông tin cá nhân, bio, và social links
- Upload avatar tùy chỉnh
- Bind Sui wallet address để push on-chain
- Hiển thị badge "On-chain" hoặc "Off-chain" tùy theo trạng thái

### 🚀 Project Showcase

- Thêm nhiều projects với hình ảnh, mô tả chi tiết
- Upload images qua Supabase Storage hoặc Walrus Quilt
- Hiển thị project gallery với lightbox
- So sánh storage options trước khi upload

### 🎓 Certificates

- Đăng chứng chỉ và thành tích chuyên nghiệp
- Self-issued certificates
- Lưu cùng profile data trong Walrus blob

### ✅ Admin Verification

- Hệ thống admin dashboard để verify developers
- Chỉ admin được chỉ định mới có quyền approve/reject
- Verified developers hiển thị badge và xuất hiện trên trang public

### 🐋 Walrus Integration

- Push profile lên Walrus blockchain storage
- Xem storage metadata (epoch, expiry, size)
- Verification links đến Suiscan và Walrus explorers
- Badge system phân biệt on-chain và off-chain profiles

### ⛽ Sponsored Transactions

- Push profile on-chain mà không cần SUI trong ví
- Server-side transaction execution
- Trải nghiệm mượt mà cho người dùng mới

### 🔄 Unbind Wallet Flow

- Hỗ trợ unbind wallet an toàn
- Warning modal khi có on-chain profile
- Cleanup Walrus metadata khi unbind
- Revert về off-chain mode

---

## 📚 Tài liệu

Dự án có đầy đủ tài liệu hướng dẫn:

- **[QUICKSTART.md](./docs/QUICKSTART.md)** - Bắt đầu nhanh trong 10 phút
- **[SETUP_GUIDE.md](./docs/SETUP_GUIDE.md)** - Hướng dẫn setup chi tiết
- **[ADMIN_SETUP.md](./docs/ADMIN_SETUP.md)** - Cấu hình admin account
- **[WALRUS_INTEGRATION.md](./docs/WALRUS_INTEGRATION.md)** - Chi tiết tích hợp Walrus
- **[ONCHAIN_STORAGE.md](./docs/ONCHAIN_STORAGE.md)** - Kiến trúc lưu trữ on-chain
- **[SUPABASE_STORAGE_SETUP.md](./docs/SUPABASE_STORAGE_SETUP.md)** - Setup Supabase Storage
- **[PROJECT_DELETION_CLEANUP.md](./docs/PROJECT_DELETION_CLEANUP.md)** - Xóa project và cleanup
- **[UNBIND_WALLET_FLOW.md](./docs/UNBIND_WALLET_FLOW.md)** - Unbind wallet workflow

---

## 🛠️ Tech Stack

- **Framework**: Astro 5.x (SSR + Static)
- **UI**: React 19 + Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (GitHub OAuth)
- **Blockchain**: Sui SDK (@mysten/sui, @mysten/dapp-kit)
- **Storage**:
  - Walrus (@mysten/walrus) - On-chain storage
  - Supabase Storage - Off-chain image storage
- **Smart Contract**: Move (Sui)
- **State Management**: Zustand
- **UI Components**: Radix UI + shadcn/ui

---

## 🚀 Bắt đầu

### Prerequisites

- Node.js 18+ và pnpm
- Supabase account (free tier)
- GitHub account cho OAuth
- Sui wallet (Sui Wallet, Suiet, hoặc Ethos)

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd dolphinder

# Install dependencies
pnpm install

# Setup environment variables
cp env.example .env
# Edit .env với Supabase credentials

# Run migrations trong Supabase Dashboard
# Xem chi tiết tại QUICKSTART.md

# Start development server
pnpm dev
```

Xem **[QUICKSTART.md](./docs/QUICKSTART.md)** để biết hướng dẫn chi tiết từng bước.

---

## 🎯 Use Cases

### Cho Developers

- **Tạo portfolio chuyên nghiệp** với proof on-chain
- **Showcase projects** với hình ảnh chất lượng cao
- **Chứng minh kinh nghiệm** qua certificates và achievements
- **Xây dựng reputation** qua verification system

### Cho Employers

- **Tìm kiếm talent** trong cộng đồng Sui developers
- **Verify credentials** trực tiếp từ blockchain
- **Xem portfolio** và project history đầy đủ

### Cho Community

- **Discover builders** trong ecosystem Sui
- **Network và collaborate** với developers khác
- **Showcase innovation** trong Web3 space

---

## 🔒 Security & Privacy

- **Row Level Security (RLS)** trên Supabase database
- **Admin verification** qua email whitelist
- **Wallet-based ownership** cho on-chain profiles
- **Public data** chỉ hiển thị verified developers
- **Private data** được bảo vệ qua authentication

---

## 🌐 Network Support

Hiện tại hỗ trợ:

- **Sui Testnet** - Môi trường development và testing
- **Mainnet** - Sẽ được hỗ trợ trong tương lai

---

## 📝 License

MIT License

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 🔗 Links

- **Walrus Documentation**: https://docs.walrus.site/
- **Sui Documentation**: https://docs.sui.io/
- **Suiscan Explorer**: https://suiscan.xyz/
- **Walrus Explorer**: https://walruscan.com/

---

**Built with ❤️ for the Sui ecosystem**
