import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Moon, Sun, LogOut, User } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold">
          ⚽ Football Booking
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/pitches">
            <Button variant="ghost">Pitches</Button>
          </Link>

          {user ? (
            <>
              <Link to="/me/bookings">
                <Button variant="ghost">My Bookings</Button>
              </Link>
              {user.role === 'ADMIN' && (
                <Link to="/admin">
                  <Button variant="ghost">Admin</Button>
                </Link>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm">{user.name}</span>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <Link to="/auth/login">
              <Button>Login</Button>
            </Link>
          )}

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </nav>
  );
}

