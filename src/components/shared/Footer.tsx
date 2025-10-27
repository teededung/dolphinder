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
              href="/community"
              className="text-sm text-white/60 transition-colors hover:text-white/80"
            >
              Community
            </a>
            <a
              href="https://github.com/terrancrypt/dolphinder"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/60 transition-colors hover:text-white/80"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

