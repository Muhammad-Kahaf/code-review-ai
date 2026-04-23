import { motion, AnimatePresence } from 'framer-motion';
import { GitForkIcon, Globe } from 'lucide-react';

import type { User } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (val: string) => void;
  githubToken: string;
  setGithubToken: (val: string) => void;
  lang: string;
  user: User | null;
}

export const SettingsModal = ({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  githubToken,
  setGithubToken,
  lang,
  user
}: SettingsModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-50 flex items-center justify-center p-6 theme-transition"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="bg-background w-full max-w-md rounded-[24px] border border-border p-8 shadow-premium relative inner-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-black text-foreground tracking-tighter uppercase font-display">System Settings</h3>
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-50">Configuration Protocol</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-all border border-transparent hover:border-border"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-3 group">
                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] px-1 opacity-60">Groq Intelligence Key</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-emerald-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                  </div>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-foreground font-mono text-xs outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-muted/20 shadow-xs"
                    placeholder="gsk_..."
                  />
                </div>
              </div>

              {user?.provider !== 'github' && (
                <div className="space-y-3 group">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] px-1 opacity-60">GitHub Connection</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-emerald-500 transition-colors">
                      <GitForkIcon size={16} strokeWidth={2.5} />
                    </div>
                    <input
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-foreground font-mono text-xs outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-muted/20 shadow-xs"
                      placeholder="Personal Access Token (PAT)..."
                    />
                  </div>
                </div>
              )}

              <div className="p-4 bg-surface border border-border rounded-2xl hover:border-emerald-500/20 transition-all shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/5 rounded-lg border border-blue-500/10 text-blue-500">
                    <Globe size={16} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-black text-foreground uppercase tracking-wider">Interface Language</p>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-50">{lang} Mode Active</p>
                  </div>
                  <div className="px-2 py-1 bg-surface-hover rounded-md border border-border text-[9px] font-black uppercase text-muted">Ready</div>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 uppercase tracking-[0.2em] text-[10px]"
            >
              Sync Configuration
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
