import { motion } from 'framer-motion';
import { Shield, Zap, Globe, ArrowRight, UserCheck, X, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
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

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 theme-transition overflow-y-auto">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto"
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
            <Logo size={60} className="shadow-xl shadow-emerald-500/20" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight font-display">
            CodeReview<span className="text-emerald-500">.AI</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm font-medium">
            AI-powered code audits & architectural intelligence.
          </p>
        </div>

        <div className="space-y-4 pt-1">
          {/* Google Sign In Button */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-full min-h-[44px] flex items-center justify-center overflow-hidden rounded-xl border border-border/80 shadow-xs hover:border-emerald-500/40 transition-all bg-white dark:bg-zinc-900">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (!credentialResponse.credential) return;

                  try {
                    const decoded = jwtDecode<Record<string, unknown>>(credentialResponse.credential);
                    
                    try {
                      const { auth } = await import('../../config/firebase');
                      if (auth) {
                        const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
                        const credential = GoogleAuthProvider.credential(credentialResponse.credential);
                        await signInWithCredential(auth, credential);
                      }
                    } catch (fbErr) {
                      console.warn("Firebase Auth sync skipped:", fbErr);
                    }

                    onLogin({
                      name: (decoded.name as string) || 'User',
                      email: (decoded.email as string) || '',
                      avatar: (decoded.picture as string) || ''
                    });
                  } catch (err: unknown) {
                    console.error("Login Error:", err);
                    setError("Google Sign-In completed with local profile.");
                  }
                }}
                onError={() => {
                  setError("Google OAuth origin not registered for this domain yet. You can continue as Guest below!");
                }}
                theme="outline"
                size="large"
                shape="rectangular"
                width="340"
              />
            </div>
            {error && (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-left">
                <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium text-amber-500 leading-snug">{error}</p>
              </div>
            )}
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold text-muted/60 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          {/* Continue as Guest Button */}
          <button
            type="button"
            onClick={onContinueGuest}
            className="w-full py-3 px-4 rounded-xl bg-background hover:bg-surface-hover border border-border text-foreground text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all group cursor-pointer shadow-xs"
          >
            <UserCheck size={16} className="text-emerald-500" />
            <span>Continue as Guest</span>
            <ArrowRight size={14} className="text-muted group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-[10px] text-muted text-center leading-relaxed">
            Guest mode allows instant code reviews without signing in.
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
