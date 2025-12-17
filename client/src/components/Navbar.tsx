import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Moon,
  Sun,
  LogOut,
  User,
  Menu,
  X,
  Calendar,
  Users,
  Trophy,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const navLinks = [
    { to: "/pitches", label: t("nav.pitches") },
    { to: "/teams", label: t("nav.teams") },
    { to: "/leagues", label: t("nav.leagues") },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        {/* Left: Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity"
        >
          <span className="text-2xl">⚽</span>
          <span className="hidden sm:inline">6-a-Side</span>
        </Link>

        {/* Middle: Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              <Button
                variant={isActive(link.to) ? "ghost" : "ghost"}
                className={cn(
                  "transition-all",
                  isActive(link.to) && "bg-accent/50 text-accent-foreground"
                )}
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* Right: User Menu & Theme Toggle */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Desktop User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="hidden md:flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden lg:inline">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{t("nav.myAccount")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/me/bookings" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {t("nav.myBookings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/teams" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t("nav.teams")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/leagues" className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      {t("nav.leagues")}
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "ADMIN" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          {t("nav.adminPanel")}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </>
          ) : (
            <Link to="/auth/login">
              <Button size="sm">{t("nav.login")}</Button>
            </Link>
          )}

          <LanguageSwitcher />
          <div className="w-2" /> {/* Spacing between language and theme */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden sm:flex"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t bg-background">
          <div className="container mx-auto max-w-7xl px-4 py-2 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive(link.to)
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t my-2" />
            <Link
              to="/me/bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm hover:bg-muted"
            >
              {t("nav.myBookings")}
            </Link>
            <Link
              to="/teams"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm hover:bg-muted"
            >
              {t("nav.teams")}
            </Link>
            <Link
              to="/leagues"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm hover:bg-muted"
            >
              {t("nav.leagues")}
            </Link>
            {user.role === "ADMIN" && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm hover:bg-muted"
              >
                {t("nav.adminPanel")}
              </Link>
            )}
            <div className="border-t my-2" />
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 rounded-md text-sm text-destructive hover:bg-muted"
            >
              {t("nav.logout")}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
