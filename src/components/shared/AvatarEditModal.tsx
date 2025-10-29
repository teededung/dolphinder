import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "./Button";

interface AvatarEditModalProps {
  currentAvatar?: string;
  onUpload: (file: File) => void;
  onClose: () => void;
}

export default function AvatarEditModal({
  currentAvatar,
  onUpload,
  onClose,
}: AvatarEditModalProps) {
  const [preview, setPreview] = useState<string>(currentAvatar || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  function handleFileSelect(file: File | null) {
    if (!file) return;

    setError("");

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Avatar file size must be less than 5MB");
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Supported: JPG, PNG, GIF, WebP");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }

  function handleSubmit() {
    if (!selectedFile) {
      setError("Please select an image");
      return;
    }
    onUpload(selectedFile);
    onClose();
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Edit Avatar</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Preview */}
      <div className="mb-6 flex justify-center">
        {preview ? (
          <img
            src={preview}
            alt="Avatar preview"
            className="h-40 w-40 rounded-full object-cover border-4 border-blue-400/30 shadow-lg"
          />
        ) : (
          <div className="h-40 w-40 rounded-full bg-gray-700 flex items-center justify-center border-4 border-gray-600">
            <Upload className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 mb-4 text-center transition-all
          ${isDragging 
            ? 'border-blue-400 bg-blue-400/10' 
            : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
          }
        `}
      >
        <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400" />
        <p className="text-sm text-gray-300 mb-2">
          Drag and drop your avatar here, or
        </p>
        <label className="inline-block">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            className="hidden"
          />
          <span className="cursor-pointer text-blue-400 hover:text-blue-300 font-medium">
            browse files
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-2">
          JPG, PNG, GIF, WebP (max 5MB)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-md bg-red-900/50 border border-red-500/50 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Selected File Info */}
      {selectedFile && (
        <div className="mb-4 rounded-md bg-green-900/50 border border-green-500/50 p-3">
          <p className="text-sm text-green-200">
            <span className="font-semibold">Selected:</span> {selectedFile.name}
          </p>
          <p className="text-xs text-green-300 mt-1">
            Size: {(selectedFile.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={onClose}
          type="button"
          className="flex-1 border border-gray-600 hover:border-gray-500"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedFile}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Upload Avatar
        </Button>
      </div>
    </div>
  );
}

