import { motion } from 'framer-motion';
import { Cpu, Shield, Zap, Globe } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import type { User } from '../../types';
import { useState } from 'react';
import { auth, githubProvider } from '../../config/firebase';
import { signInWithPopup, GithubAuthProvider, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

interface LoginProps {
  onLogin: (user: User, token?: string) => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  const handleGithubLogin = async () => {
    setIsGithubLoading(true);
    setError(null);
    try {
      const { getAdditionalUserInfo } = await import('firebase/auth');
      const result = await signInWithPopup(auth, githubProvider);
      console.log("Firebase GitHub Login Result:", result);
      
      const additionalInfo = getAdditionalUserInfo(result);
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      console.log("Extracted GitHub Token:", token ? "EXISTS" : "MISSING");
      
      if (result.user) {
        // Use UID as a fallback key if email is missing
        const userKey = result.user.email ? result.user.email.replace(/[.@]/g, '_') : result.user.uid;
        
        // Pre-save token to storage to avoid race conditions in usePersistence
        if (token && userKey) {
           const { EncryptionService } = await import('../../services/encryptionService');
           const hashedKey = EncryptionService.hashKey(`review_github_token_${userKey}`);
           localStorage.setItem(hashedKey, EncryptionService.encrypt(token, userKey));
           console.log("Pre-saved token to storage for:", userKey);
        }

        const githubUsername = additionalInfo?.username;
        onLogin({
          uid: result.user.uid,
          name: result.user.displayName || githubUsername || 'GitHub User',
          email: result.user.email || '',
          avatar: result.user.photoURL || '',
          provider: 'github'
        }, token || undefined);
      }
    } catch (err) {
      console.error("GitHub Login Error:", err);
      setError(err.message || "GitHub authentication failed.");
    } finally {
      setIsGithubLoading(false);
    }
  };

  // Update Google login too
  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) return;

    try {
      const decoded = jwtDecode<Record<string, unknown>>(credentialResponse.credential);
      const credential = GoogleAuthProvider.credential(credentialResponse.credential);
      const result = await signInWithCredential(auth, credential);
      
      onLogin({
        uid: result.user.uid,
        name: decoded.name as string,
        email: decoded.email as string,
        avatar: decoded.picture as string,
        provider: 'google'
      });
    } catch (err) {
      console.error("Firebase Sync Error:", err);
      setError(`Sync Error: ${err.code === 'auth/configuration-not-found' ? 'Google Sign-In is not enabled.' : err.message}`);
    }
  };

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
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* Google Login */}
            <div className="w-full h-14 flex items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-zinc-900 border border-border shadow-sm hover:border-emerald-500/50 transition-all duration-300">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Authentication failed. Please try again.")}
                useOneTap
                theme="outline"
                size="large"
                shape="rectangular"
              />
            </div>

            <div className="flex items-center gap-4 w-full">
               <div className="h-px flex-1 bg-border/50" />
               <span className="text-[9px] font-black text-muted/40 uppercase tracking-[0.2em]">or continue with</span>
               <div className="h-px flex-1 bg-border/50" />
            </div>

            {/* GitHub Login Button */}
            <button
              onClick={handleGithubLogin}
              disabled={isGithubLoading}
              className="w-full h-14 flex items-center justify-center gap-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black uppercase tracking-[0.1em] text-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              {isGithubLoading ? 'Connecting...' : 'Continue with GitHub'}
            </button>

            {error && (
              <p className="mt-2 text-[11px] font-bold text-red-500 uppercase tracking-widest">{error}</p>
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
