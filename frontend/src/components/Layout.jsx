import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BottomNav from './BottomNav';
import SidebarNav from './Sidebarnav';
import MobileDrawer from './MobileDrawer';

export default function Layout({ children, title, subtitle }) {
  const { user }          = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Sidebar — desktop only */}
      <SidebarNav />

      {/* Mobile drawer */}
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Main content */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-40 bg-app-bg/95 backdrop-blur-sm px-5 pt-safe-top pb-4 lg:pt-8 lg:px-8">
          <div className="max-w-mobile mx-auto lg:max-w-none flex items-center justify-between">
            {/* Left: hamburger (mobile) + title */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Hamburger — mobile only */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden icon-btn bg-white text-gray-600 hover:bg-navy-faint hover:text-navy shadow-card flex-shrink-0"
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>

              <div className="min-w-0">
                {subtitle && (
                  <p className="section-label mb-0.5 leading-none">{subtitle}</p>
                )}
                {title && (
                  <h1 className="text-xl font-bold text-black leading-tight truncate">{title}</h1>
                )}
              </div>
            </div>

            {/* Right: avatar — mobile only */}
            <div className="lg:hidden flex-shrink-0 ml-2">
              <div className="w-10 h-10 bg-navy rounded-2xl flex items-center justify-center shadow-card">
                <span className="text-white text-sm font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-5 pt-4 pb-28 lg:pt-6 lg:pb-8 lg:px-8">
          <div className="max-w-mobile mx-auto lg:max-w-none">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <div className="lg:hidden">
        <BottomNav onMenuOpen={() => setDrawerOpen(true)} />
      </div>
    </div>
  );
}
