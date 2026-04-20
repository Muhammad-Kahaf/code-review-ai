import { motion } from 'framer-motion';
import { Cpu, Shield, Zap, Globe } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import type { User } from '../../types';
import { useState } from 'react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-6 theme-transition overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md space-y-10"
      >
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20"
          >
            <Cpu size={32} strokeWidth={1.5} />
          </motion.div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-foreground tracking-tighter font-display">
              CodeReview<span className="text-emerald-500">.AI</span>
            </h1>
            <p className="text-muted text-base font-medium font-sans">
              Enter the next generation of code intelligence.
            </p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-[32px] p-8 shadow-sm space-y-6">
          <div className="flex flex-col items-center justify-center">
            <div className="w-full h-14 flex items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-zinc-900 border border-border shadow-sm hover:border-emerald-500/50 transition-all duration-300">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  const decoded = jwtDecode<Record<string, unknown>>(credentialResponse.credential!);
                  onLogin({
                    name: decoded.name as string,
                    email: decoded.email as string,
                    avatar: decoded.picture as string
                  });
                }}
                onError={() => setError("Authentication failed. Please try again.")}
                useOneTap
                theme="outline"
                size="large"
                shape="rectangular"
              />
            </div>
            {error && (
              <p className="mt-4 text-[11px] font-bold text-red-500 uppercase tracking-widest">{error}</p>
            )}
          </div>

          <div className="pt-6 border-t border-border flex flex-col gap-4 text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/60">Ready to audit production codebases?</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 text-muted/40">
          <Shield size={20} strokeWidth={1.5} />
          <Zap size={20} strokeWidth={1.5} />
          <Globe size={20} strokeWidth={1.5} />
        </div>
      </motion.div>
    </div>
  );
};
