import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const adminNav = [
  { to: '/dashboard',   icon: '📊', label: 'Dashboard'   },
  { to: '/production',  icon: '⚙️', label: 'Production'  },
  { to: '/purchase',    icon: '📦', label: 'Purchase'    },
  { to: '/sales',       icon: '🧾', label: 'Sales'       },
  { to: '/outstanding', icon: '💰', label: 'Outstanding' },
  { to: '/costing',     icon: '🧮', label: 'Costing'     },
  { to: '/expenses',    icon: '📋', label: 'Expenses'    },
  { to: '/masters',     icon: '🗂️', label: 'Masters'     },
];

export default function SidebarNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 fixed left-0 top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8 border-b border-gray-100">
        <div className="w-10 h-10 bg-navy rounded-2xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">G</span>
        </div>
        <div>
          <p className="font-bold text-black text-sm leading-tight">GEO Pet Bottles</p>
          <p className="text-gray-400 text-xs">Manufacturing</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {adminNav.map(item => (
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
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-6 border-t border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3 bg-app-bg rounded-2xl mb-2">
          <div className="w-8 h-8 bg-navy rounded-xl flex items-center justify-center">
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
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}