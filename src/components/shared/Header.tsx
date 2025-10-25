import { useState } from "react";
import ConnectBtn from "../common/ConnectBtn";
import { Button } from "../ui/button";

const navItems = [
  {
    label: "Learn",
    href: "/learn",
  },
  {
    label: "Developers",
    href: "/developers",
  },
  {
    label: "Community",
    href: "/community",
  },
  {
    label: "Showcase",
    href: "/showcase",
  },
];

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-2">
        {/* Desktop Header */}
        <div className="flex items-center justify-between">
          <a className="text-2xl font-bold flex items-center gap-2" href="/">
            <img src="/dolphinder-logo.png" alt="Dolphinder" className="h-12 w-auto" />
            <span className="text-xl font-bold">Dolphinder</span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-6 md:flex">
            {navItems.map(item => (
              <a
                href={item.href}
                className="text-white/90 transition-colors duration-200 hover:text-white"
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop Connect Button */}
          <div className="hidden md:block">
            <ConnectBtn />
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 flex-col space-y-1 md:hidden"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <span
              className={`h-0.5 w-6 bg-white transition-all duration-300 ${
                isMobileMenuOpen ? "translate-y-2 rotate-45" : ""
              }`}
            ></span>
            <span
              className={`h-0.5 w-6 bg-white transition-all duration-300 ${
                isMobileMenuOpen ? "opacity-0" : ""
              }`}
            ></span>
            <span
              className={`h-0.5 w-6 bg-white transition-all duration-300 ${
                isMobileMenuOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            ></span>
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
            isMobileMenuOpen ? "mt-4 max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="flex flex-col space-y-4 border-t border-white/10 py-4">
            {navItems.map(item => (
              <a
                href={item.href}
                className="py-2 text-white/90 transition-colors duration-200 hover:text-white"
                key={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="border-t border-white/10 pt-4">
              <ConnectBtn />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
