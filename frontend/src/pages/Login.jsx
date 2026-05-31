import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import geoLogo from '../../logo/GEO LOGO.png';

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/dashboard' : '/production');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center px-4 py-8">

      {/* Full-screen overlay while logging in */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-app-bg/95 backdrop-blur-sm animate-fade-in">
          <img src={geoLogo} alt="GEO Packs" className="w-32 h-auto object-contain mb-8" />
          <Loader2 size={28} className="text-navy animate-spin mb-4" />
          <p className="text-sm font-semibold text-navy">Signing you in…</p>
          <p className="text-xs text-gray-400 mt-1">Please wait</p>
        </div>
      )}

      <div className="w-full max-w-mobile">
        {/* Logo */}
        <div className="text-center mb-10">
          <img src={geoLogo} alt="Geo Packs" className="h-20 w-auto mx-auto" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-card p-8">
          <h2 className="text-xl font-bold text-black mb-1">Welcome back</h2>
          <p className="text-gray-400 text-sm mb-7">Sign in to your account</p>

          {error && (
            <div className="flex items-center gap-2 bg-danger-bg border border-red-100 text-danger text-sm rounded-2xl px-4 py-3 mb-5">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block section-label mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-base"
                placeholder="you@example.com"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block section-label mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-base pr-11"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary mt-2 flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                : 'Sign In'
              }
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          GEO Pet Bottles © 2026 — Pollachi
        </p>
      </div>
    </div>
  );
}
