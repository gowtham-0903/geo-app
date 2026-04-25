export default function FormField({ label, error, children }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {label}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full bg-app-bg border-0 rounded-2xl px-4 py-3 text-sm font-medium text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-light transition ${className}`}
    />
  );
}

export function Select({ children, className = '', ...props }) {
  return (
    <select
      {...props}
      className={`w-full bg-app-bg border-0 rounded-2xl px-4 py-3 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-navy-light transition appearance-none ${className}`}
    >
      {children}
    </select>
  );
}