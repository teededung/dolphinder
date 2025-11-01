# Project Deletion with Automatic Image Cleanup

## Overview

Khi user xóa project, hệ thống sẽ tự động xóa tất cả images liên quan từ Supabase Storage để tránh tích lũy storage rác và tiết kiệm chi phí.

## Implementation

### 1. API Endpoint

**File:** `src/pages/api/projects/delete-images.ts`

**Endpoint:** `POST /api/projects/delete-images`

**Request Body:**
```json
{
  "images": [
    "filename.jpg",
    {
      "filename": "project-123.jpg",
      "quiltPatchId": "..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deleted 2 images",
  "deletedCount": 2,
  "failedCount": 0,
  "deleted": ["filename.jpg", "project-123.jpg"],
  "failed": []
}
```

**Tính năng:**
- Hỗ trợ cả format cũ (string) và mới (ProjectImage object)
- Tự động bỏ qua Walrus images (chỉ xóa Supabase Storage images)
- Xử lý cả URL đầy đủ và filename
- Tự động thêm `userId` prefix cho storage path
- Graceful error handling (không throw nếu xóa thất bại)

### 2. Component Integration

**File:** `src/components/dashboard/ProjectsManager.tsx`

**Flow khi xóa project:**

```typescript
const handleDelete = async () => {
  // Step 1: Delete images from Supabase Storage
  if (projectToDelete.images && projectToDelete.images.length > 0) {
    await fetch('/api/projects/delete-images', {
      method: 'POST',
      body: JSON.stringify({ images: projectToDelete.images })
    });
  }

  // Step 2: Update projects in database
  await fetch('/api/profile/update-projects', {
    method: 'POST',
    body: JSON.stringify({ projects: updatedProjects })
  });
};
```

**Đặc điểm:**
- Xóa images trước, sau đó mới update database
- Không block project deletion nếu image deletion fails
- Console logging để debug
- Error handling với revert state nếu cần

## Behavior

### Supabase Storage Images

✅ **Được xóa tự động:**
- Images có `filename` field
- Images được lưu trong bucket `projects`
- Path format: `{userId}/{filename}`

### Walrus Images

❌ **KHÔNG được xóa:**
- Images có `quiltPatchId` hoặc `blobId`
- Lý do: Walrus là immutable blockchain storage
- Blob data vẫn tồn tại trên Walrus nhưng không còn được reference

### Local Filesystem Images

⚠️ **Chưa được xử lý:**
- Images trong `public/projects/` (local development)
- Cần manual cleanup hoặc script riêng
- Không ảnh hưởng trên production (serverless)

## Testing

### Manual Testing Steps

1. **Test xóa project với Supabase images:**
   ```
   - Tạo project mới
   - Upload 2-3 images (sẽ lưu vào Supabase Storage)
   - Xóa project
   - Kiểm tra console logs: "Images deleted: {...}"
   - Verify trong Supabase Dashboard: images đã bị xóa
   ```

2. **Test xóa project với Walrus images:**
   ```
   - Tạo project với images từ Walrus
   - Xóa project
   - Kiểm tra: Walrus images không bị xóa (skipped)
   - Project vẫn được xóa thành công
   ```

3. **Test error handling:**
   ```
   - Tạo project với invalid image paths
   - Xóa project
   - Kiểm tra: Project vẫn được xóa mặc dù images fail
   - Error được log ra console
   ```

### Expected Console Logs

**Success case:**
```
[ProjectsManager] Deleting project images: 3
[delete-images] Attempting to delete: userId/project-123-timestamp.jpg
[delete-images] Successfully deleted: userId/project-123-timestamp.jpg
[ProjectsManager] Images deleted: { deletedCount: 3, failedCount: 0 }
```

**Partial failure case:**
```
[ProjectsManager] Deleting project images: 2
[delete-images] Error deleting from storage: Object not found
[ProjectsManager] Failed to delete some images: { failedCount: 1 }
[ProjectsManager] Error deleting images: {...}
// Project deletion continues...
```

## Storage Cost Savings

**Trước khi có tính năng:**
- Mỗi project xóa = 5 images rác (tối đa)
- 100 projects = 500 images không dùng = ~50-150MB storage rác
- Chi phí tích lũy theo thời gian

**Sau khi có tính năng:**
- Images được xóa tự động
- Storage luôn clean
- Tiết kiệm chi phí storage

## Error Handling

### Graceful Degradation

1. **Image deletion fails:**
   - Log warning ra console
   - Continue với project deletion
   - Project vẫn được xóa thành công

2. **Invalid image format:**
   - Skip image đó
   - Continue với images khác
   - Không throw error

3. **Supabase connection error:**
   - Log error
   - Project deletion vẫn proceed
   - User được thông báo success

### Không Revert

- Nếu xóa images thất bại, KHÔNG revert project deletion
- Lý do: Project data quan trọng hơn image cleanup
- Images có thể cleanup sau bằng manual script

## Future Improvements

1. **Batch deletion:**
   - Xóa nhiều images cùng lúc thay vì từng cái
   - Cải thiện performance

2. **Cleanup script:**
   - Script để tìm và xóa orphaned images
   - Chạy định kỳ (cronjob)

3. **Storage analytics:**
   - Dashboard để xem storage usage
   - Alert khi storage gần đầy

4. **Soft delete:**
   - Đánh dấu project là deleted thay vì xóa hẳn
   - Cho phép restore trong 30 ngày
   - Auto cleanup sau 30 ngày

## Related Files

- `src/pages/api/projects/delete-images.ts` - API endpoint
- `src/components/dashboard/ProjectsManager.tsx` - Component integration
- `src/lib/media-upload.ts` - Helper functions (reference only)
- `docs/SUPABASE_STORAGE_SETUP.md` - Storage setup guide

