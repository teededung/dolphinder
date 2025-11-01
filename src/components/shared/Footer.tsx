import { Send, Facebook } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-black/20 py-8 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-3 md:items-center md:gap-8">
          {/* Brand - Left */}
          <a
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80 shrink-0 justify-self-start"
          >
            <img
              src="/dolphinder-logo.png"
              alt="Dolphinder"
              className="w-6"
            />
            <span className="text-sm font-semibold text-white/80">
              Dolphinder
            </span>
          </a>

          {/* Copyright - Center */}
          <p className="text-sm text-white/60 text-center justify-self-center">
            © {currentYear} Dolphinder. All rights reserved.
          </p>

          {/* Links - Right */}
          <div className="flex items-center gap-4 shrink-0 justify-self-end">
            <a
              href="https://t.me/dolphinder"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 transition-colors hover:text-white/80"
              aria-label="Telegram"
            >
              <Send className="h-5 w-5" />
            </a>
            <a
              href="https://www.facebook.com/groups/688138073614433"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 transition-colors hover:text-white/80"
              aria-label="Facebook Group"
            >
              <Facebook className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex md:hidden flex-col items-center justify-center gap-5 w-full text-center">
          {/* Brand */}
          <a
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <img
              src="/dolphinder-logo.png"
              alt="Dolphinder"
              className="w-6"
            />
            <span className="text-sm font-semibold text-white/80">
              Dolphinder
            </span>
          </a>

          {/* Copyright */}
          <p className="text-sm text-white/60 w-full text-center">
            © {currentYear} Dolphinder. All rights reserved.
          </p>

          {/* Social Icons Only - Mobile */}
          <div className="flex items-center gap-4">
            <a
              href="https://t.me/dolphinder"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 transition-colors hover:text-white/80"
              aria-label="Telegram"
            >
              <Send className="h-5 w-5" />
            </a>
            <a
              href="https://www.facebook.com/groups/688138073614433"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 transition-colors hover:text-white/80"
              aria-label="Facebook Group"
            >
              <Facebook className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

