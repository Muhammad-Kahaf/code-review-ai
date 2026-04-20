import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, GitForkIcon, Send, Loader, Shield, Cpu } from 'lucide-react';
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
}

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
  setShowGithubModal
}: CommandBarProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [code]);

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 pointer-events-none z-30">
      <div className="pointer-events-auto bg-surface/80 backdrop-blur-2xl border border-border shadow-2xl rounded-[28px] p-2 flex flex-col gap-2 relative">

        {/* Subtle Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-full backdrop-blur-md shadow-sm"
            >
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Context Chips */}
        <div className="flex items-center gap-1.5 px-2 py-1 overflow-x-auto scrollbar-hide">
          {['Security', 'Performance', 'Architecture'].map(mode => (
            <button
              key={mode}
              onClick={() => setFocusModes(prev => prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode])}
              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${focusModes.includes(mode) ? 'bg-emerald-500 text-white shadow-lg' : 'bg-surface hover:bg-surface-hover text-muted hover:text-foreground border border-border'}`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div
          className={`flex items-end gap-2 p-2 rounded-[22px] transition-all duration-300 ${isDragging ? 'bg-emerald-500/5 ring-4 ring-emerald-500/10' : ''}`}
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
            accept=".js,.jsx,.ts,.tsx,.py,.css,.html,.json,.md,.txt,.java,.cpp,.c,.go,.rs,.rb,.php"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all flex items-center justify-center shrink-0 border border-transparent hover:border-border"
          >
            <Paperclip size={18} strokeWidth={2} />
          </button>

          <button
            onClick={() => setShowGithubModal(true)}
            className="w-10 h-10 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all flex items-center justify-center shrink-0 border border-transparent hover:border-border"
            title="Browse GitHub Repositories"
          >
            <GitForkIcon size={18} strokeWidth={2} />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReview(); } }}
            placeholder={isDragging ? "Drop files to analyze..." : "Message CodeReview.AI..."}
            className="flex-1 bg-transparent border-none text-foreground font-sans text-[15px] outline-none min-h-[40px] max-h-60 resize-none scrollbar-hide py-2 px-2 placeholder:text-muted/50 font-medium"
          />

          <motion.button
            disabled={!code.trim() || isReviewing}
            onClick={handleReview}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 text-white flex items-center justify-center shrink-0 shadow-lg disabled:opacity-20 disabled:grayscale transition-all"
          >
            {isReviewing ? <Loader size={18} className="animate-spin" /> : <Send size={18} strokeWidth={2.5} />}
          </motion.button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-6 opacity-30 pointer-events-none">
        <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em]"><Shield size={10} /> Encrypted</div>
        <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em]"><Cpu size={10} /> Llama 3.3 Core</div>
      </div>
    </div>
  );
};
