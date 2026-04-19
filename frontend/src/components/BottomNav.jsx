import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const supervisorNav = [
  { to: '/production', icon: '⚙️', label: 'Production' },
  { to: '/purchase',   icon: '📦', label: 'Purchase'   },
  { to: '/sales',      icon: '🧾', label: 'Sales'      },
  { to: '/dashboard',  icon: '📊', label: 'Dashboard'  },
];

const adminNav = [
  { to: '/dashboard',    icon: '📊', label: 'Dashboard'   },
  { to: '/outstanding',  icon: '💰', label: 'Outstanding' },
  { to: '/expenses',     icon: '📋', label: 'Expenses'    },
  { to: '/masters',      icon: '⚙️', label: 'Masters'     },
];

export default function BottomNav() {
  const { user } = useAuth();
  const navItems = user?.role === 'admin' ? adminNav : supervisorNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div className="w-full max-w-mobile bg-white border-t border-gray-100 px-2 pb-safe">
        <div className="flex items-center justify-around">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-3 px-4 rounded-2xl transition-all ${
                  isActive
                    ? 'text-navy'
                    : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${
                    isActive ? 'bg-navy' : ''
                  }`}>
                    <span className="text-xl">{item.icon}</span>
                  </div>
                  <span className={`text-xs font-medium ${isActive ? 'text-navy' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}