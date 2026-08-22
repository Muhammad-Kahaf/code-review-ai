import { motion } from 'framer-motion';
import { Shield, Zap, Globe, ArrowRight, UserCheck, X, AlertCircle } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import type { User } from '../../types';
import { Logo } from '../common/Logo';
import { useState } from 'react';

interface LoginProps {
  onLogin: (user: User) => void;
  onContinueGuest: () => void;
  canClose?: boolean;
}

export const Login = ({ onLogin, onContinueGuest, canClose = true }: LoginProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        
        const profile = userInfo.data;

        // Try syncing to Firebase if configured
        try {
          const { auth } = await import('../../config/firebase');
          if (auth) {
            console.log("Authenticated Google profile:", profile.email);
          }
        } catch (fbErr) {
          console.warn("Firebase Auth sync skipped:", fbErr);
        }

        onLogin({
          name: profile.name || 'User',
          email: profile.email || '',
          avatar: profile.picture || ''
        });
      } catch (err) {
        console.error("Failed to fetch Google profile:", err);
        setError("Failed to fetch Google profile. You can continue as guest.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError("Google Sign-In failed or cancelled. You can continue as guest.");
      setIsLoading(false);
    }
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 theme-transition overflow-y-auto">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm sm:max-w-md bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto"
      >
        {canClose && (
          <button
            type="button"
            onClick={onContinueGuest}
            className="absolute top-4 right-4 p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-hover transition-all cursor-pointer"
            title="Continue as Guest"
          >
            <X size={18} />
          </button>
        )}

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center">
            <Logo size={58} className="shadow-xl shadow-emerald-500/20" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight font-display">
            CodeReview<span className="text-emerald-500">.AI</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm font-medium">
            AI-powered code audits & architectural intelligence.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {/* Custom Native Google Sign In Button */}
          <button
            type="button"
            onClick={() => {
              setError(null);
              loginWithGoogle();
            }}
            disabled={isLoading}
            className="w-full h-12 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>

          {error && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-left">
              <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-amber-500 leading-snug">{error}</p>
            </div>
          )}

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold text-muted/60 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          {/* Continue as Guest Button (Identical dimensions & matching aesthetic) */}
          <button
            type="button"
            onClick={onContinueGuest}
            className="w-full h-12 px-4 rounded-xl bg-surface-hover hover:bg-surface border border-border hover:border-emerald-500/40 text-foreground text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-200 group cursor-pointer shadow-xs"
          >
            <UserCheck size={16} className="text-emerald-500" />
            <span>Continue as Guest</span>
            <ArrowRight size={14} className="text-muted group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </button>

          <p className="text-[10px] text-muted text-center leading-relaxed pt-1">
            Guest mode gives instant access without storing in cloud.
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 text-muted/40 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider"><Shield size={12} /> Encrypted</div>
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider"><Zap size={12} /> High Speed</div>
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider"><Globe size={12} /> Multi-Language</div>
        </div>
      </motion.div>
    </div>
  );
};
