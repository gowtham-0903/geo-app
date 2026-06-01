import { useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Settings, Package, Receipt, FileText,
  DollarSign, Calculator, ClipboardList, Database,
  LogOut, X, Boxes,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import geoLogo from '../../logo/GEO LOGO.png';

const allNav = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard',   adminOnly: false },
  { to: '/production',  icon: Settings,        label: 'Production',  adminOnly: false },
  { to: '/purchase',    icon: Package,         label: 'Purchase',    adminOnly: false },
  { to: '/sales',       icon: Receipt,         label: 'Sales',       adminOnly: false },
  { to: '/invoices',    icon: FileText,        label: 'Invoices',    adminOnly: false },
  { to: '/stock',       icon: Boxes,           label: 'Stock',       adminOnly: false },
  { to: '/outstanding', icon: DollarSign,      label: 'Outstanding', adminOnly: true  },
  { to: '/costing',     icon: Calculator,      label: 'Costing',     adminOnly: true  },
  { to: '/expenses',    icon: ClipboardList,   label: 'Expenses',    adminOnly: true  },
  { to: '/masters',     icon: Database,        label: 'Masters',     adminOnly: true  },
];

export default function MobileDrawer({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const location          = useLocation();

  const navItems = allNav.filter(item => !item.adminOnly || user?.role === 'admin');

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else        document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on route change
  useEffect(() => { onClose(); }, [location.pathname]);

  async function handleLogout() {
    onClose();
    await logout();
    navigate('/login');
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={`fixed top-0 left-0 z-[90] h-full w-[280px] max-w-[85vw] bg-white flex flex-col
          shadow-[4px_0_24px_rgba(0,30,97,0.15)] transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <img src={geoLogo} alt="Geo Packs" className="h-8 w-auto" />
          <button
            onClick={onClose}
            className="icon-btn bg-app-bg text-gray-500 hover:bg-gray-200"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-gray-50">
          <div className="flex items-center gap-3 bg-navy-faint rounded-2xl px-3 py-2.5">
            <div className="w-9 h-9 bg-navy rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-black truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-navy text-white'
                    : 'text-gray-600 hover:bg-app-bg hover:text-black'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={18}
                    className={isActive ? 'text-navy-light' : 'text-gray-400'}
                    strokeWidth={isActive ? 2.5 : 1.75}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
