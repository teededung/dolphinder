import { ImageIcon } from 'lucide-react';

interface ProjectImagePlaceholderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Placeholder component for project images when they fail to load
 */
export function ProjectImagePlaceholder({ 
  size = 'md', 
  className = '' 
}: ProjectImagePlaceholderProps) {
  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${className}
        relative
        flex 
        items-center 
        justify-center 
        rounded-md 
        border-2 
        border-dashed 
        border-gray-300 
        bg-gradient-to-br 
        from-gray-50 
        to-gray-100
        transition-all
        duration-200
        hover:border-gray-400
        hover:from-gray-100
        hover:to-gray-150
      `}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Icon */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <ImageIcon className={`${iconSizes[size]} text-gray-400`} />
        {size !== 'sm' && (
          <span className="mt-1 text-[10px] text-gray-400 font-medium">No Image</span>
        )}
      </div>
    </div>
  );
}

