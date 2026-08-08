'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { Sparkles, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
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

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Google sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Premium background decorative blur blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-[#E4EAE1]/45 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#F5EEEE]/50 blur-[90px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-5%] w-[30%] h-[30%] rounded-full bg-[#F2EDE4]/40 blur-[70px] pointer-events-none" />

      <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-[2rem] border border-[#ECE9E0] shadow-[0_20px_50px_-12px_rgba(207,201,188,0.22)] p-8 sm:p-10 flex flex-col gap-6 relative z-10">
        
        {/* Logo / Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#E1E5DF] flex items-center justify-center border border-[#CCD1C8] shadow-sm">
            <Sparkles className="w-5 h-5 text-[#4A5449]" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#2C302E]">intent<span className="text-[#5A6F57] font-semibold">IQ</span></span>
            <span className="block text-[8px] text-[#8C867C] font-bold uppercase tracking-widest leading-none mt-1">AI recommendation storefront</span>
          </div>
          <h2 className="text-base font-medium text-[#555047] mt-2">Welcome back</h2>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-[#F7EFEF] border border-[#EACDCD] rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-[#7D4141] font-medium animate-fade-in">
            <AlertCircle className="w-4 h-4 text-[#A85858] flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Direct Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-[#FAF9F6] hover:bg-[#F2EFE8] text-[#2C302E] font-medium py-3 px-4 rounded-xl border border-[#ECE9E0] transition-all flex items-center justify-center gap-3 text-xs sm:text-sm shadow-sm active:scale-[0.98] disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.2.0 10.05.0 12s.47 3.8 1.29 5.42l3.99-3.15z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 my-[-4px]">
          <div className="flex-1 h-[1px] bg-[#ECE9E0]" />
          <span className="text-[10px] text-[#8C867C] font-semibold uppercase tracking-wider">or</span>
          <div className="flex-1 h-[1px] bg-[#ECE9E0]" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C867C]">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full bg-[#FAF9F6] border border-[#E3DFC8]/35 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-[#2C302E] placeholder-[#9F9A90] focus:outline-none focus:ring-1 focus:ring-[#8C9A8B] focus:border-[#8C9A8B] focus:bg-white transition-all shadow-inner"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C867C]">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full bg-[#FAF9F6] border border-[#E3DFC8]/35 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-[#2C302E] placeholder-[#9F9A90] focus:outline-none focus:ring-1 focus:ring-[#8C9A8B] focus:border-[#8C9A8B] focus:bg-white transition-all shadow-inner"
            />
          </div>

          <div className="flex justify-end -mt-1">
            <Link href="/forgot-password" className="text-[11px] text-[#5A6F57] hover:text-[#415340] font-medium transition-colors">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2C302E] hover:bg-[#1C1F1E] text-[#FCFAF7] font-medium py-3.5 px-4 rounded-xl transition-all shadow-[0_4px_14px_rgba(44,48,46,0.12)] hover:shadow-[0_6px_20px_rgba(44,48,46,0.18)] active:scale-[0.98] disabled:opacity-50 mt-3 text-xs sm:text-sm"
          >
            {loading ? 'Verifying credentials...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs text-[#8C867C] border-t border-[#ECE9E0] pt-5 font-medium">
          Don't have an account?{' '}
          <Link href="/signup" className="text-[#5A6F57] hover:text-[#415340] font-semibold transition-colors">
            Sign up now
          </Link>
        </div>

      </div>
    </div>
  );
}

