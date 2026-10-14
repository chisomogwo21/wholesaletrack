import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, LogOut } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Orders', path: '/orders' },
  { label: 'Products', path: '/products' },
  { label: 'Customers', path: '/customers' },
  { label: 'Suppliers', path: '/suppliers' },
];

export default function AppLayout() {
  const { signOut, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F6] text-primary flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-surface border-b border-border sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Text */}
            <div className="flex items-center gap-8">
              <NavLink
                to="/orders"
                className="text-lg font-bold tracking-tight text-primary hover:opacity-90 transition-opacity"
              >
                WholesaleTrack
              </NavLink>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `px-3.5 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-primary font-semibold border-b-2 border-primary -mb-[1px]'
                          : 'text-muted hover:text-primary'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Desktop User Info & Logout */}
            <div className="hidden md:flex items-center gap-4">
              {user?.email && (
                <span className="text-xs text-muted">
                  {user.email}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted hover:text-primary transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-muted hover:text-primary transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-surface px-4 pt-2 pb-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 text-base font-medium rounded-none transition-colors ${
                    isActive
                      ? 'bg-neutral/40 text-primary font-semibold'
                      : 'text-muted hover:text-primary hover:bg-neutral/20'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="pt-3 border-t border-border mt-2">
              {user?.email && (
                <div className="px-3 py-1 text-xs text-muted truncate">
                  {user.email}
                </div>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-error hover:bg-error/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
