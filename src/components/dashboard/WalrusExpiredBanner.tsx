import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface WalrusExpiredBannerProps {
  username: string;
  onDismiss?: () => void;
}

const WalrusExpiredBanner = ({ username, onDismiss }: WalrusExpiredBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const storageKey = `walrus-expired-dismissed-${username}`;

  useEffect(() => {
    // Check if banner was dismissed before
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    // Save dismissed state to localStorage
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4 text-orange-800 relative">
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 text-orange-600 hover:text-orange-800 transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
      <h3 className="flex items-center gap-2 font-semibold pr-6">
        <AlertTriangle className="size-5" />
        File Walrus đã hết hạn
      </h3>
      <p className="mt-1 text-sm pr-6">
        File lưu trữ trên Walrus của bạn đã hết hạn và không còn khả dụng. 
        Profile của bạn đã được chuyển sang chế độ offchain. 
        Bạn có thể upload lại lên Walrus bất cứ lúc nào từ dashboard.
      </p>
    </div>
  );
};

export default WalrusExpiredBanner;

