export default function FormField({ label, error, children }) {
  return (
    <div className="mb-4">
      <label className="block section-label mb-2">
        {label}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>}
    </div>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`input-base ${className}`}
    />
  );
}

export function Select({ children, className = '', ...props }) {
  return (
    <select
      {...props}
      className={`input-base appearance-none ${className}`}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      {...props}
      className={`input-base resize-none ${className}`}
    />
  );
}
