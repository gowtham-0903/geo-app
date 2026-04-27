// frontend/src/components/FAB.jsx
// Mobile Floating Action Button — consistent across all pages
// Usage: <FAB onClick={openAdd} icon="+" label="Add Entry" />
//        <FAB onClick={openAdd} icon="+" label="Invoice" color="green" />

export default function FAB({ onClick, icon = '+', label, color = 'navy', disabled = false }) {
  const colorMap = {
    navy:   'bg-navy text-white shadow-navy/30',
    green:  'bg-green-500 text-white shadow-green-500/30',
    orange: 'bg-orange-500 text-white shadow-orange-500/30',
    red:    'bg-red-500 text-white shadow-red-500/30',
  };
  const cls = colorMap[color] || colorMap.navy;

  return (
    <div className="lg:hidden fixed bottom-[88px] right-4 z-[45] flex flex-col items-end gap-2">
      {label && (
        <span className="bg-black/70 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
          {label}
        </span>
      )}
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          w-14 h-14 rounded-full flex items-center justify-center
          text-2xl font-bold shadow-xl transition-transform active:scale-95
          disabled:opacity-50 ${cls}
        `}
        aria-label={label || 'Action'}
      >
        {icon}
      </button>
    </div>
  );
}

// Multi-FAB — multiple actions stacked (like Gmail's compose button)
// Usage:
// <MultiFAB actions={[
//   { icon: '+', label: 'Morning', onClick: () => openShift('morning'), color: 'navy' },
//   { icon: '🌙', label: 'Night', onClick: () => openShift('night'), color: 'orange' },
// ]} />

import { useState } from 'react';

export function MultiFAB({ actions = [] }) {
  const [open, setOpen] = useState(false);

  if (actions.length === 1) {
    return <FAB {...actions[0]} />;
  }

  const colorMap = {
    navy:   'bg-navy text-white',
    green:  'bg-green-500 text-white',
    orange: 'bg-orange-500 text-white',
    red:    'bg-red-500 text-white',
  };

  return (
    <div className="lg:hidden fixed bottom-[88px] right-4 z-[45] flex flex-col items-end gap-3">
      {/* Sub-actions (shown when open) */}
      {open && (
        <div className="flex flex-col items-end gap-2">
          {[...actions].reverse().map((action, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="bg-black/70 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm whitespace-nowrap">
                {action.label}
              </span>
              <button
                onClick={() => { action.onClick(); setOpen(false); }}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg transition-transform active:scale-95 ${colorMap[action.color] || colorMap.navy}`}
              >
                {action.icon}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-xl transition-all active:scale-95 ${
          open ? 'bg-gray-700 text-white rotate-45' : 'bg-navy text-white'
        }`}
      >
        +
      </button>
    </div>
  );
}
