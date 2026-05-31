import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Settings, Package, Receipt, FileText,
  DollarSign, Calculator, ClipboardList, Database,
  LogOut, Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import geoLogo from '../../logo/GEO LOGO.png';

const allNav = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard',   adminOnly: false },
  { to: '/production',  icon: Settings,        label: 'Production',  adminOnly: false },
  { to: '/purchase',    icon: Package,         label: 'Purchase',    adminOnly: false },
  { to: '/sales',       icon: Receipt,         label: 'Sales',       adminOnly: false },
  { to: '/invoices',    icon: FileText,        label: 'Invoices',    adminOnly: false },
  { to: '/outstanding', icon: DollarSign,      label: 'Outstanding', adminOnly: true  },
  { to: '/costing',     icon: Calculator,      label: 'Costing',     adminOnly: true  },
  { to: '/expenses',    icon: ClipboardList,   label: 'Expenses',    adminOnly: true  },
  { to: '/masters',     icon: Database,        label: 'Masters',     adminOnly: true  },
  { to: '/admin/users', icon: Users,           label: 'Users',       adminOnly: true  },
];

export default function SidebarNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const navItems = allNav.filter(item => !item.adminOnly || user?.role === 'admin');

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 fixed left-0 top-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-100">
        <img src={geoLogo} alt="Geo Packs" className="h-10 w-auto" />
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-navy text-white'
                  : 'text-gray-500 hover:bg-app-bg hover:text-black'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={18}
                  className={isActive ? 'text-navy-light' : 'text-gray-400'}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3 bg-app-bg rounded-2xl mb-1">
          <div className="w-8 h-8 bg-navy rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-black truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
