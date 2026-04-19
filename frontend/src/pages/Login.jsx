import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center px-4">
      <div className="w-full max-w-mobile">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-navy rounded-3xl mb-5 shadow-lg">
            <span className="text-white text-3xl font-bold">G</span>
          </div>
          <h1 className="text-3xl font-bold text-black tracking-tight">GEO Pet Bottles</h1>
          <p className="text-gray-400 text-sm mt-2 font-medium">Manufacturing Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-black mb-1">Welcome back</h2>
          <p className="text-gray-400 text-sm mb-7">Sign in to your account</p>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-app-bg border-0 rounded-2xl px-4 py-4 text-sm font-medium text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-light transition"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-app-bg border-0 rounded-2xl px-4 py-4 text-sm font-medium text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-light transition"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy hover:bg-opacity-90 disabled:bg-opacity-50 text-white font-semibold rounded-2xl py-4 text-sm transition-all mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
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