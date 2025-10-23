import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type ProfileAvatarProps = {
  src?: string | null;
  name: string;
  username?: string;
  className?: string;
  size?: number; // optional fixed size in px; otherwise use className sizing
  alt?: string;
};

export function ProfileAvatar({ src, name, username, className, size, alt }: ProfileAvatarProps) {
  const [currentSrc, setCurrentSrc] = React.useState<string | undefined>(
    src ?? (username ? `https://github.com/${username}.png` : undefined)
  );
  const [failed, setFailed] = React.useState(false);

  const handleStatusChange = (status: 'idle' | 'normal' | 'loading' | 'loaded' | 'error') => {
    if (status === 'error') {
      setFailed(true);
    }
  };

  const style = size ? ({ width: size, height: size } as React.CSSProperties) : undefined;
  
  // Generate initials from name or username
  const getInitials = (name: string, username?: string) => {
    if (name) {
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    return '??';
  };

  const initials = getInitials(name, username);

  return (
    <Avatar className={cn(className)} style={style}>
      {!failed && currentSrc ? (
        <AvatarImage src={currentSrc} alt={alt ?? name} onLoadingStatusChange={handleStatusChange} />
      ) : (
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

export default ProfileAvatar;