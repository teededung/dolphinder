import * as DialogPrimitive from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LightboxDialogProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  altText?: string;
}

/**
 * Unified lightbox dialog for displaying full-size images
 * Uses higher z-index (z-[100]) to ensure it appears above other modals
 */
export default function LightboxDialog({ 
  isOpen, 
  imageSrc, 
  onClose,
  altText = 'Preview'
}: LightboxDialogProps) {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        {/* Overlay with z-[100] - Click to close */}
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[100] bg-black/90 cursor-pointer",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
          onClick={onClose}
        />
        
        {/* Content with z-[100] */}
        <DialogPrimitive.Content
          className={cn(
            "fixed top-[50%] left-[50%] z-[100]",
            "translate-x-[-50%] translate-y-[-50%]",
            "w-[95vw] h-[95vh] max-w-[95vw] max-h-[95vh]",
            "bg-transparent border-0 p-4",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "focus:outline-none"
          )}
          onPointerDownOutside={(e) => {
            // Prevent closing when clicking on the content itself
            e.preventDefault();
          }}
        >
          {/* Accessible title for screen readers */}
          <VisuallyHidden>
            <DialogPrimitive.Title>
              {altText || 'Image Preview'}
            </DialogPrimitive.Title>
          </VisuallyHidden>

          {/* Close button */}
          <DialogPrimitive.Close
            className={cn(
              "absolute top-4 right-4 z-10",
              "rounded-full bg-black/50 p-2",
              "text-white opacity-70 hover:opacity-100",
              "transition-opacity cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-white/50"
            )}
          >
            <XIcon className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Image container - Click image to close */}
          {imageSrc && (
            <div 
              className="flex items-center justify-center w-full h-full cursor-pointer"
              onClick={onClose}
            >
              <img
                src={imageSrc}
                alt={altText}
                className="max-w-full max-h-full w-auto h-auto object-contain"
                onClick={(e) => {
                  // Stop propagation to prevent double-closing
                  e.stopPropagation();
                  onClose();
                }}
              />
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

