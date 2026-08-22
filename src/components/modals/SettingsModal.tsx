import { motion, AnimatePresence } from 'framer-motion';
import { GitForkIcon, Globe, Zap, X, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  githubToken: string;
  setGithubToken: (val: string) => void;
  lang: string;
}

export const SettingsModal = ({
  isOpen,
  onClose,
  githubToken,
  setGithubToken,
  lang
}: SettingsModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 theme-transition overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-background w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl sm:rounded-[28px] border border-border p-5 sm:p-7 shadow-2xl relative inner-border scrollbar-hide my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight uppercase font-display">System Settings</h3>
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-60">System Configuration</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* GitHub PAT */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-wider px-1 opacity-75">
                  GitHub Personal Access Token (Optional)
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
                    <GitForkIcon size={15} />
                  </div>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-foreground font-mono text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-muted/30"
                    placeholder="ghp_... (for private repos & PR reviews)"
                  />
                </div>
                <p className="text-[10px] text-muted/70 px-1">
                  Needed only for scanning private repos and posting PR comments.
                </p>
              </div>

              {/* AI Engine Status */}
              <div className="p-3.5 bg-surface border border-border rounded-xl flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
                  <ShieldCheck size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-foreground uppercase tracking-wide">AI Gateway Auth</p>
                  <p className="text-[10px] text-muted font-medium truncate">Managed via System Environment</p>
                </div>
                <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20 text-[9px] font-bold uppercase">Connected</div>
              </div>

              {/* Analysis Engine */}
              <div className="p-3.5 bg-surface border border-border rounded-xl flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg shrink-0">
                  <Zap size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-foreground uppercase tracking-wide">Analysis Engine</p>
                  <p className="text-[10px] text-muted font-medium truncate">CodeReview.AI High-Speed Neural Core</p>
                </div>
                <div className="px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded border border-purple-500/20 text-[9px] font-bold uppercase">Ready</div>
              </div>

              {/* Language */}
              <div className="p-3.5 bg-surface border border-border rounded-xl flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 shrink-0">
                  <Globe size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-foreground uppercase tracking-wide">Interface Language</p>
                  <p className="text-[10px] text-muted font-medium truncate">{lang} Protocol Active</p>
                </div>
                <div className="px-2 py-0.5 bg-surface-hover rounded border border-border text-[9px] font-bold uppercase text-muted">Auto</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full mt-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 hover:-translate-y-0.5 transition-all duration-200 uppercase tracking-widest text-xs cursor-pointer"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
