# Supabase Storage Setup

## Tổng quan

Dolphinder sử dụng Supabase Storage để lưu trữ project images trên Netlify và các môi trường serverless khác. Trong môi trường local development, code sẽ tự động fallback về filesystem.

## Thiết lập Supabase Storage Bucket

### Bước 1: Tạo Storage Bucket

1. Đăng nhập vào Supabase Dashboard
2. Vào **Storage** section
3. Click **New bucket**
4. Tạo bucket với tên: `projects`
5. Đặt bucket là **Public** (để có thể truy cập ảnh qua public URL)
6. Click **Create bucket**

### Bước 2: Cấu hình Storage Policies (Optional)

Nếu bạn muốn kiểm soát quyền truy cập, có thể tạo policies:

```sql
-- Cho phép authenticated users upload ảnh
CREATE POLICY "Users can upload their own project images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'projects' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Cho phép authenticated users xóa ảnh của mình
CREATE POLICY "Users can delete their own project images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'projects' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Cho phép public read (để hiển thị ảnh)
CREATE POLICY "Public can view project images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'projects');
```

### Bước 3: Kiểm tra Environment Variables

Đảm bảo các biến môi trường sau được set:

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Cách hoạt động

### Trên Serverless (Netlify/Vercel)

- Ảnh được upload lên Supabase Storage bucket `projects`
- Path format: `{userId}/{sanitizedProjectId}-{timestamp}.{ext}`
- Trả về public URL từ Supabase Storage

### Trên Local Development

- Ảnh được lưu vào `public/projects/`
- Path format: `/projects/{sanitizedProjectId}-{timestamp}.{ext}`
- Hoạt động như trước đây

## Migration

Nếu bạn đã có ảnh cũ trong filesystem và muốn migrate lên Supabase Storage:

1. Tạo script migration để upload các ảnh hiện có
2. Cập nhật database để thay đổi image paths từ `/projects/...` sang Supabase Storage URLs
3. Sau khi migration xong, có thể xóa thư mục `public/projects/` (optional)

## Troubleshooting

### Lỗi: "Bucket not found"

- Đảm bảo bucket `projects` đã được tạo trong Supabase Dashboard
- Kiểm tra bucket name có đúng là `projects` (lowercase)

### Lỗi: "Permission denied"

- Kiểm tra bucket có được set là Public không
- Hoặc tạo Storage Policies như hướng dẫn ở trên

### Lỗi: "Failed to upload to Supabase Storage"

- Kiểm tra environment variables
- Kiểm tra Supabase client đã được khởi tạo đúng chưa
- Xem console logs để biết chi tiết lỗi
