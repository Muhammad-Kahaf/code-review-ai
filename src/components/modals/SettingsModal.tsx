import { motion, AnimatePresence } from 'framer-motion';
import { GitForkIcon, X, Check } from 'lucide-react';
import { useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  githubToken: string;
  setGithubToken: (val: string) => void;
}

export const SettingsModal = ({
  isOpen,
  onClose,
  githubToken,
  setGithubToken,
}: SettingsModalProps) => {
  const [tempToken, setTempToken] = useState(githubToken);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setGithubToken(tempToken);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 400);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 theme-transition overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="bg-surface w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl relative my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Settings</h3>
                <p className="text-xs text-muted">Manage integrations and tokens</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 pt-5">
              {/* GitHub PAT */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>GitHub Personal Access Token</span>
                  <span className="text-[10px] font-normal text-muted">Optional</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
                    <GitForkIcon size={15} />
                  </div>
                  <input
                    type="password"
                    value={tempToken}
                    onChange={(e) => setTempToken(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-foreground font-mono text-xs outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-muted/40"
                    placeholder="ghp_... (Classic or Fine-grained PAT)"
                  />
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Used only to read private repositories and post comments on Pull Requests.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {saved ? <Check size={14} className="text-emerald-500" /> : null}
                <span>{saved ? 'Saved' : 'Save Changes'}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
