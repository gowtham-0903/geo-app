import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

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

export function Input({ className = '', onWheel, ...props }) {
  const isNumber = props.type === 'number';
  return (
    <input
      {...props}
      // Number inputs: enforce min=0 (no negatives) unless caller explicitly sets min
      min={isNumber && props.min === undefined ? '0' : props.min}
      // Blur on scroll so the mouse wheel scrolls the page instead of changing the value
      onWheel={isNumber ? (e => e.currentTarget.blur()) : onWheel}
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

// ── GSTIN Input with live backend validation ──────────────────
export function GstinInput({ value, onChange, placeholder = 'e.g. 33AAOFG1270C1ZT', ...props }) {
  const [status,  setStatus]  = useState(null); // null | 'loading' | 'valid' | 'invalid'
  const [message, setMessage] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    if (!value) { setStatus(null); setMessage(''); return; }

    // immediate format length hint
    if (value.length < 15) {
      setStatus('invalid');
      setMessage(`${15 - value.length} more character${15 - value.length > 1 ? 's' : ''} needed`);
      return;
    }

    setStatus('loading');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const r = await api.get('/validate/gstin', { params: { gstin: value } });
        setStatus(r.data.valid ? 'valid' : 'invalid');
        setMessage(r.data.message);
      } catch {
        setStatus(null);
        setMessage('');
      }
    }, 400);

    return () => clearTimeout(timerRef.current);
  }, [value]);

  const borderStyle =
    status === 'valid'   ? { borderColor: '#16a34a' } :
    status === 'invalid' ? { borderColor: '#ef4444' } : {};

  return (
    <div>
      <div className="relative">
        <input
          {...props}
          value={value}
          onChange={e => onChange({ ...e, target: { ...e.target, value: e.target.value.toUpperCase() } })}
          placeholder={placeholder}
          maxLength={15}
          className="input-base pr-9 uppercase"
          style={borderStyle}
        />
        {/* Status icon */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
          {status === 'loading' && (
            <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
          )}
          {status === 'valid'   && <span className="text-green-600 font-bold">✓</span>}
          {status === 'invalid' && <span className="text-red-500 font-bold">✗</span>}
        </span>
      </div>
      {message && status !== 'loading' && (
        <p className={`text-xs mt-1.5 font-medium ${status === 'valid' ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
