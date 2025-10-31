import { Send, Facebook } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-black/20 py-8 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
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
          <p className="text-sm text-white/60">
            © {currentYear} Dolphinder. All rights reserved.
          </p>

          {/* Links */}
          <div className="flex items-center gap-4">
            <a
              href="/developers"
              className="text-sm text-white/60 transition-colors hover:text-white/80"
            >
              Developers
            </a>
            <a
              href="https://t.me/dolphinder"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white/80"
              aria-label="Telegram"
            >
              <Send className="h-4 w-4" />
              <span>Telegram</span>
            </a>
            <a
              href="https://www.facebook.com/groups/688138073614433"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white/80"
              aria-label="Facebook Group"
            >
              <Facebook className="h-4 w-4" />
              <span>Facebook</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

