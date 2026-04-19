import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNav from './BottomNav';
import SidebarNav from './SidebarNav';

export default function Layout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Sidebar — desktop only */}
      <SidebarNav />

      {/* Main content */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-40 bg-app-bg px-5 pt-12 pb-4 lg:pt-8 lg:px-8">
          <div className="max-w-mobile mx-auto lg:max-w-none flex items-start justify-between">
            <div>
              {subtitle && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  {subtitle}
                </p>
              )}
              {title && (
                <h1 className="text-2xl font-bold text-black">{title}</h1>
              )}
            </div>
            {/* Avatar — mobile only */}
            <div className="lg:hidden flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm"
              >
                <span className="text-sm">🚪</span>
              </button>
              <div className="w-10 h-10 bg-navy rounded-2xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-5 pb-28 lg:pb-8 lg:px-8">
          <div className="max-w-mobile mx-auto lg:max-w-none">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}