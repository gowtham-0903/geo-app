import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Settings, Package, Receipt,
  DollarSign, ClipboardList, MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const supervisorNav = [
  { to: '/production', icon: Settings,        label: 'Production' },
  { to: '/purchase',   icon: Package,         label: 'Purchase'   },
  { to: '/sales',      icon: Receipt,         label: 'Sales'      },
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
];

const adminNav = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/production',  icon: Settings,        label: 'Production'  },
  { to: '/outstanding', icon: DollarSign,      label: 'Outstanding' },
  { to: '/expenses',    icon: ClipboardList,   label: 'Expenses'    },
];

export default function BottomNav({ onMenuOpen }) {
  const { user }   = useAuth();
  const location   = useLocation();
  const navItems   = user?.role === 'admin' ? adminNav : supervisorNav;

  // Routes not covered by the bottom nav tabs
  const quickRoutes = navItems.map(n => n.to);
  const isMoreActive = !quickRoutes.includes(location.pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div className="w-full max-w-mobile bg-white border-t border-gray-100 pb-safe">
        <div className="flex items-center justify-around px-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-0.5 py-2 px-2 min-w-[60px] flex-1"
            >
              {({ isActive }) => (
                <>
                  <div className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${
                    isActive ? 'bg-navy' : ''
                  }`}>
                    <item.icon
                      size={20}
                      className={isActive ? 'text-white' : 'text-gray-400'}
                      strokeWidth={isActive ? 2.5 : 1.75}
                    />
                  </div>
                  <span className={`text-[10px] font-semibold leading-none ${
                    isActive ? 'text-navy' : 'text-gray-400'
                  }`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* More button — opens the full drawer */}
          <button
            onClick={onMenuOpen}
            className="flex flex-col items-center gap-0.5 py-2 px-2 min-w-[60px] flex-1"
          >
            <div className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${
              isMoreActive ? 'bg-navy' : ''
            }`}>
              <MoreHorizontal
                size={20}
                className={isMoreActive ? 'text-white' : 'text-gray-400'}
                strokeWidth={isMoreActive ? 2.5 : 1.75}
              />
            </div>
            <span className={`text-[10px] font-semibold leading-none ${
              isMoreActive ? 'text-navy' : 'text-gray-400'
            }`}>
              More
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
