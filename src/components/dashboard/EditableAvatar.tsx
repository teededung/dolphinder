import { useState } from "react";
import { Pencil } from "lucide-react";
import { useModalStore } from "../../store/useModalStore";
import AvatarEditModal from "../shared/AvatarEditModal";

interface EditableAvatarProps {
  avatar?: string;
  name: string;
  username: string;
}

export default function EditableAvatar({ 
  avatar, 
  name, 
  username 
}: EditableAvatarProps) {
  const [uploading, setUploading] = useState(false);
  const { open, close } = useModalStore();

  async function handleAvatarUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/dashboard/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload avatar');
      }

      close();
      // Reload to show new avatar
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error("Failed to upload avatar:", error);
      alert(error.message || 'Failed to upload avatar');
      setUploading(false);
    }
  }

  function openAvatarEditModal() {
    if (uploading) return;
    
    open({
      content: (
        <AvatarEditModal
          currentAvatar={avatar}
          onUpload={handleAvatarUpload}
          onClose={close}
        />
      ),
    });
  }

  return (
    <div className="relative mx-auto w-32 h-32">
      {/* Avatar or placeholder */}
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="h-32 w-32 rounded-full object-cover"
        />
      ) : (
        <div className="h-32 w-32 rounded-full bg-gray-700 flex items-center justify-center">
          <span className="text-3xl text-gray-400">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      
      {/* Hover overlay with edit button */}
      <button
        onClick={openAvatarEditModal}
        disabled={uploading}
        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer disabled:cursor-not-allowed"
        aria-label="Edit avatar"
      >
        <div className="flex flex-col items-center gap-1">
          <Pencil className="h-6 w-6 text-white" />
          <span className="text-xs text-white font-medium">
            {uploading ? "Uploading..." : "Edit"}
          </span>
        </div>
      </button>
    </div>
  );
}

