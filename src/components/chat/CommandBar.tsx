import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, GitForkIcon, ArrowUp, Loader2, AlertCircle, Shield, CornerDownLeft, X } from 'lucide-react';
import type { ChangeEvent, DragEvent, RefObject } from 'react';

interface CommandBarProps {
  code: string;
  setCode: (val: string) => void;
  isReviewing: boolean;
  handleReview: () => void;
  error: string;
  focusModes: string[];
  setFocusModes: (modes: string[] | ((prev: string[]) => string[])) => void;
  isDragging: boolean;
  setIsDragging: (val: boolean) => void;
  onDrop: (e: DragEvent) => void;
  handleFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  setShowGithubModal: (val: boolean) => void;
  onClearError?: () => void;
}

const ALL_FOCUS_MODES = ['Security', 'Performance', 'Clean Code', 'Logic', 'Architecture'];

export const CommandBar = ({
  code,
  setCode,
  isReviewing,
  handleReview,
  error,
  focusModes,
  setFocusModes,
  isDragging,
  setIsDragging,
  onDrop,
  handleFileUpload,
  fileInputRef,
  setShowGithubModal,
  onClearError
}: CommandBarProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollH, 180)}px`;
    }
  }, [code]);

  const toggleFocusMode = (mode: string) => {
    setFocusModes(prev =>
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  const lineCount = code.trim() ? code.trim().split('\n').length : 0;

  return (
    <div className="absolute bottom-2 sm:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-3 sm:px-6 md:px-8 pointer-events-none z-30">
      <div className="pointer-events-auto bg-surface/95 dark:bg-surface/98 backdrop-blur-2xl border border-border shadow-2xl rounded-2xl p-2 sm:p-2.5 flex flex-col gap-2 relative transition-all duration-200">

        {/* Error Toast Notification */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute -top-12 sm:-top-14 left-2 right-2 sm:left-auto sm:right-auto sm:left-1/2 sm:-translate-x-1/2 bg-red-500/10 dark:bg-red-500/15 border border-red-500/30 px-3 sm:px-4 py-2 rounded-xl backdrop-blur-xl shadow-lg flex items-center justify-between sm:justify-start gap-2.5 z-40 max-w-md"
            >
              <AlertCircle size={15} className="text-red-500 shrink-0" />
              <p className="text-[11px] font-semibold text-red-500 truncate flex-1">{error}</p>
              {onClearError && (
                <button onClick={onClearError} className="p-0.5 rounded text-red-500/70 hover:text-red-500">
                  <X size={13} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audit Filter Modules */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-1 py-0.5 overflow-x-auto scrollbar-hide">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted/60 pl-1 pr-1 hidden sm:inline-block shrink-0">
            AUDIT:
          </span>
          {ALL_FOCUS_MODES.map(mode => {
            const active = focusModes.includes(mode);
            return (
              <button
                key={mode}
                type="button"
                onClick={() => toggleFocusMode(mode)}
                className={`px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-150 shrink-0 cursor-pointer ${
                  active
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'bg-background hover:bg-surface-hover text-muted hover:text-foreground border border-border/80'
                }`}
              >
                {mode}
              </button>
            );
          })}
          {lineCount > 0 && (
            <span className="ml-auto text-[9px] font-mono font-bold text-muted/60 px-2 shrink-0 hidden sm:inline-block">
              {lineCount} {lineCount === 1 ? 'line' : 'lines'}
            </span>
          )}
        </div>

        {/* Code Input Console */}
        <div
          className={`flex items-end gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-xl transition-all duration-200 ${
            isDragging ? 'bg-emerald-500/10 ring-2 ring-emerald-500/30' : 'bg-background border border-border/70'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            multiple
            accept=".js,.jsx,.ts,.tsx,.py,.css,.html,.json,.md,.txt,.java,.cpp,.c,.go,.rs,.rb,.php,.sql,.yaml,.yml"
          />

          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-all flex items-center justify-center shrink-0 cursor-pointer"
            title="Upload source file(s)"
          >
            <Paperclip size={16} strokeWidth={1.75} />
          </button>

          {/* GitHub Integration Button */}
          <button
            type="button"
            onClick={() => setShowGithubModal(true)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-all flex items-center justify-center shrink-0 cursor-pointer"
            title="Inspect GitHub repository or Pull Request"
          >
            <GitForkIcon size={16} strokeWidth={1.75} />
          </button>

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && (e.ctrlKey || e.metaKey || window.innerWidth > 768)) {
                e.preventDefault();
                handleReview();
              }
            }}
            placeholder={isDragging ? "Drop source code to inspect..." : "Paste code snippet, GitHub repository link, or ask for review..."}
            className="flex-1 bg-transparent border-none text-foreground font-mono text-xs sm:text-[13px] outline-none min-h-[36px] max-h-44 resize-none scrollbar-hide py-2 px-1 placeholder:text-muted/50 leading-relaxed"
          />

          {/* Clear Button if text exists */}
          {code.trim() && !isReviewing && (
            <button
              type="button"
              onClick={() => setCode('')}
              className="w-7 h-7 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              title="Clear input"
            >
              <X size={14} />
            </button>
          )}

          {/* Execute Audit Button */}
          <motion.button
            type="button"
            disabled={!code.trim() || isReviewing}
            onClick={handleReview}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="Execute Code Audit"
          >
            {isReviewing ? <Loader2 size={15} className="animate-spin" /> : <ArrowUp size={16} strokeWidth={2.2} />}
          </motion.button>
        </div>

        {/* Footer Badges */}
        <div className="flex items-center justify-between px-2 pt-0.5 text-[8px] sm:text-[9px] font-mono font-semibold text-muted/60 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Shield size={11} className="text-emerald-500" />
            <span>Encrypted Sandbox</span>
          </div>
          <div className="flex items-center gap-1">
            <CornerDownLeft size={10} className="text-muted" />
            <span className="hidden sm:inline">Press Enter to audit</span>
            <span className="sm:hidden">Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
