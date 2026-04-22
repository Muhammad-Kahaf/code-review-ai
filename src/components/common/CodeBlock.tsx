import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

export const CodeBlock = ({ children, className, ...props }: React.ComponentProps<'code'> & { className?: string }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  const handleCopy = async () => {
    if (codeRef.current) {
      const text = codeRef.current.textContent || '';
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCodeBlock = className && className.startsWith('language-');

  if (isCodeBlock) {
    return (
      <div className="relative group my-5">
        <div className="absolute top-0 right-0 flex items-center gap-1.5 p-1 px-2.5 bg-slate-800/90 dark:bg-slate-900 border-b border-l border-border/40 rounded-bl-xl text-[9px] font-black font-mono text-muted opacity-0 group-hover:opacity-100 transition-all duration-300 uppercase tracking-widest z-10">
          {className.replace('language-', '')}
          <motion.button
            onClick={handleCopy}
            whileTap={{ scale: 0.9 }}
            className="p-1 hover:text-emerald-500 transition-colors"
            aria-label="Copy code"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          </motion.button>
        </div>
        <pre className={`${className} bg-slate-900! dark:bg-slate-950! border border-border/80! rounded-xl! overflow-hidden max-w-full p-4! font-mono! text-[12px]! leading-relaxed! shadow-sm!`}>
          <code ref={codeRef} {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  }

  return (
    <code className={`${className} bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-mono text-[11px] border border-emerald-500/10`} {...props}>
      {children}
    </code>
  );
};
