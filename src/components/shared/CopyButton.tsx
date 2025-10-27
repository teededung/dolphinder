import { useState, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { buttonVariants } from '../ui/button';
import type { VariantProps } from 'class-variance-authority';

interface CopyButtonProps extends VariantProps<typeof buttonVariants> {
  originText: string;
  originHtml?: string;
  className?: string;
}

export default function CopyButton({
  originText,
  originHtml,
  className = '',
  variant = 'ghost',
  size = 'icon-sm',
}: CopyButtonProps) {
  const [copiedText, setCopiedText] = useState('');
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * copyContent:
   * - If `originHtml` exists, try to copy as HTML (and fallback to text).
   * - If no `originHtml`, copy text normally.
   */
  async function copyContent() {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    setCopiedText('');

    setTimeout(async () => {
      try {
        // Check if originText has valid value
        if (!originText) return;

        if (originHtml && window.ClipboardItem) {
          const clipboardData = new ClipboardItem({
            'text/html': new Blob([originHtml], { type: 'text/html' }),
            'text/plain': new Blob([originText], { type: 'text/plain' }),
          });
          await navigator.clipboard.write([clipboardData]);
        } else {
          await navigator.clipboard.writeText(originText);
        }

        setCopiedText(originText);
      } catch (err) {
        console.error('Error when copying:', err);
      }

      timeoutIdRef.current = setTimeout(() => {
        setCopiedText('');
        timeoutIdRef.current = null;
      }, 2000);
    }, 10);
  }

  // Clean up timeout when component is destroyed
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  // Icon sizes based on button size
  const iconSizes: Record<string, string> = {
    default: 'h-4 w-4',
    sm: 'h-4 w-4',
    lg: 'h-5 w-5',
    icon: 'h-4 w-4',
    'icon-sm': 'h-3 w-3',
    'icon-lg': 'h-5 w-5',
  };

  // Check if size is icon variant
  const isIconSize = size?.includes('icon');
  const showCopiedText = !isIconSize && size !== 'sm';
  const iconSize = iconSizes[size || 'default'] || 'h-4 w-4';

  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant, size }), className)}
      title="Copy"
      onClick={copyContent}
    >
      {copiedText !== '' && copiedText === originText ? (
        <>
          <Check className={cn('text-green-500', iconSize)} />
          {showCopiedText && <span className="text-xs text-green-500">Copied</span>}
        </>
      ) : (
        <Copy className={iconSize} />
      )}
    </button>
  );
}

