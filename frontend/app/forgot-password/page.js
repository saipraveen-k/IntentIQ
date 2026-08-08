'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { Sparkles, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send password reset email. Please check your email address.');
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

      <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-[2rem] border border-[#ECE9E0] shadow-[0_20px_50px_-12px_rgba(207,201,188,0.22)] p-8 sm:p-10 flex flex-col gap-8 relative z-10">
        
        {/* Logo / Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#E1E5DF] flex items-center justify-center border border-[#CCD1C8] shadow-sm">
            <Sparkles className="w-5 h-5 text-[#4A5449]" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#2C302E]">intent<span className="text-[#5A6F57] font-semibold">IQ</span></span>
            <span className="block text-[8px] text-[#8C867C] font-bold uppercase tracking-widest leading-none mt-1">AI recommendation storefront</span>
          </div>
          <h2 className="text-base font-medium text-[#555047] mt-3">Reset your password</h2>
          <p className="text-xs text-[#8C867C] max-w-xs leading-relaxed">
            Enter your email address below and we'll send you instructions to reset your password.
          </p>
        </div>

        {/* Success Alert */}
        {success ? (
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-14 h-14 rounded-full bg-[#EFF5F0] flex items-center justify-center border border-[#DCEBE0]">
              <CheckCircle className="w-7 h-7 text-[#3D6948]" />
            </div>
            <div className="p-4 bg-[#EFF5F0] border border-[#DCEBE0] rounded-2xl text-xs text-[#3D6948] leading-relaxed">
              Password reset link sent to <span className="font-semibold">{email}</span>. Please check your email inbox to reset your password.
            </div>
            <Link
              href="/login"
              className="w-full bg-[#2C302E] hover:bg-[#1C1F1E] text-[#FCFAF7] font-medium py-3.5 px-4 rounded-xl transition-all shadow-[0_4px_14px_rgba(44,48,46,0.12)] active:scale-[0.98] text-xs sm:text-sm text-center flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            {/* Error Alert */}
            {error && (
              <div className="p-4 bg-[#F7EFEF] border border-[#EACDCD] rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-[#7D4141] font-medium animate-fade-in">
                <AlertCircle className="w-4 h-4 text-[#A85858] flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2C302E] hover:bg-[#1C1F1E] text-[#FCFAF7] font-medium py-3.5 px-4 rounded-xl transition-all shadow-[0_4px_14px_rgba(44,48,46,0.12)] hover:shadow-[0_6px_20px_rgba(44,48,46,0.18)] active:scale-[0.98] disabled:opacity-50 text-xs sm:text-sm"
              >
                {loading ? 'Sending reset link...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="text-center text-xs text-[#8C867C] border-t border-[#ECE9E0] pt-5 font-medium">
              Remember your password?{' '}
              <Link href="/login" className="text-[#5A6F57] hover:text-[#415340] font-semibold transition-colors">
                Sign in
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
