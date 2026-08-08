'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { Sparkles, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 flex flex-col gap-6">
        
        {/* Logo / Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-slate-800">intent<span className="text-indigo-600">IQ</span></span>
            <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5">AI recommendations storefront</span>
          </div>
          <h2 className="text-base font-bold text-slate-700 mt-2">Sign in to your account</h2>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-rose-600 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 disabled:opacity-50 mt-2 text-xs sm:text-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 border-t border-slate-50 pt-4 font-medium">
          Don't have an account?{' '}
          <Link href="/signup" className="text-indigo-600 hover:text-indigo-700 font-bold">
            Sign up now
          </Link>
        </div>

      </div>
    </div>
  );
}
