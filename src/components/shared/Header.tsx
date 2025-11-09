import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/browserClient";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { getDeveloperProfile, isAdmin as checkIsAdmin } from "../../lib/auth";
import { Menu } from "lucide-react";
import dolphinderLogo from "../../assets/dolphinder-logo.png";

const navItems = [
  {
    label: "About",
    href: "/about",
  },
  {
    label: "Learn",
    href: "/learn",
  },
  {
    label: "Developers",
    href: "/developers",
  },
  {
    label: "Showcase",
    href: "/showcase",
  },
];

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (user && session) {
        // Sync session to server-side cookies if not already synced
        try {
          await fetch('/api/auth/session-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }),
            credentials: 'include', // Important: include cookies in request
          });
        } catch (err) {
          // Continue anyway, user might still be authenticated client-side
        }

        setIsAuthenticated(true);
        setUserEmail(user.email || null);
        setUserId(user.id || null);
        setIsAdmin(user.email ? checkIsAdmin(user.email) : false);
        try {
          const profile = await getDeveloperProfile(supabase, user.id);
          if (profile?.avatar) {
            setAvatarUrl(profile.avatar);
          }
        } catch (_) {
          // ignore avatar errors
        }
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        setUserId(null);
        setAvatarUrl(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const avatarFallback = (userEmail || "U").charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10 md:hidden"
          onClick={closeMobileMenu}
        />
      )}
      
      <header className="fixed top-0 right-0 left-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-2">
        {/* Desktop Header */}
        <div className="flex items-center justify-between">
          <a className="text-2xl font-bold flex items-center gap-2" href="/">
            <img src={dolphinderLogo.src} alt="Dolphinder" className="h-12 w-auto" width={dolphinderLogo.width} height={dolphinderLogo.height} loading="eager" fetchPriority="high" />
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

          {/* Desktop Auth Button */}
          <div className="hidden items-center gap-3 md:flex w-[120px] justify-end">
            {isLoading ? (
              <div className="h-9 w-24 animate-pulse rounded-md bg-white/10" />
            ) : (
              <>
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center outline-none h-9 w-9 p-0 rounded-full cursor-pointer appearance-none bg-transparent ring-1 ring-white/10 hover:bg-white/10 focus-visible:ring-white/40 transition-colors">
                      <Avatar className="size-9">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl} alt={userEmail || "avatar"} />
                        ) : (
                          <AvatarFallback>{avatarFallback}</AvatarFallback>
                        )}
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="min-w-44" sideOffset={8} align="end">
                      {isAdmin && (
                        <DropdownMenuItem onClick={() => (window.location.href = "/admin/dashboard")}>Admin Dashboard</DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => (window.location.href = "/dashboard")}>Dashboard</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={handleLogout}>Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    onClick={() => window.location.href = "/register"}
                    className="bg-white text-black hover:bg-white/90"
                  >
                    Get Started
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden text-white"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <Menu className="size-6" />
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
                onClick={closeMobileMenu}
              >
                {item.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
              {isLoading ? (
                <div className="h-10 w-full animate-pulse rounded-md bg-white/10" />
              ) : (
                <>
                  {isAuthenticated ? (
                    <div className="flex items-center justify-between">
                      <div className="text-white/70 text-sm truncate max-w-[60%]">{userEmail}</div>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center outline-none h-9 w-9 p-0 rounded-full cursor-pointer appearance-none bg-transparent ring-1 ring-white/10 hover:bg-white/10 focus-visible:ring-white/40 transition-colors">
                          <Avatar className="size-9">
                            {avatarUrl ? (
                              <AvatarImage src={avatarUrl} alt={userEmail || "avatar"} />
                            ) : (
                              <AvatarFallback>{avatarFallback}</AvatarFallback>
                            )}
                          </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="min-w-44" sideOffset={8} align="end">
                          {isAdmin && (
                            <DropdownMenuItem onClick={() => { closeMobileMenu(); window.location.href = "/admin/dashboard"; }}>Admin Dashboard</DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => { closeMobileMenu(); window.location.href = "/dashboard"; }}>Dashboard</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => { closeMobileMenu(); handleLogout(); }}>Logout</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
                    <Button
                      onClick={() => { closeMobileMenu(); window.location.href = "/register"; }}
                      className="bg-white text-black hover:bg-white/90"
                    >
                      Get Started
                    </Button>
                  )}
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;
