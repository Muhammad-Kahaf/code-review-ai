import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Copy, Check, Terminal, Bot, ChevronDown, ChevronUp, FileCode } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../../types';
import { CodeBlock } from '../common/CodeBlock';

interface MessageItemProps {
  message: Message;
  downloadReport: (content: string) => void;
}

export const MessageItem = ({ message, downloadReport }: MessageItemProps) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = async () => {
    const textToCopy = message.code || message.content;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';
  const codeLines = message.code ? message.code.split('\n').length : 0;
  const isLongCode = codeLines > 25;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col gap-3 rounded-2xl transition-all ${
        isUser 
          ? 'bg-transparent py-1' 
          : 'bg-surface/60 dark:bg-surface/40 p-4 sm:p-6 border border-border/80 shadow-xs'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shadow-xs ${
              isUser
                ? 'bg-zinc-800 text-zinc-100 dark:bg-zinc-700'
                : 'bg-emerald-500 text-white shadow-emerald-500/20'
            }`}
          >
            {isUser ? <Terminal size={14} /> : <Bot size={15} />}
          </div>
          <div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isUser ? 'text-muted' : 'text-emerald-500'}`}>
              {isUser ? 'Source Code / Query' : 'Architectural Review'}
            </span>
            {message.timestamp && (
              <span className="text-[9px] font-medium text-muted/60 ml-2">
                {message.timestamp}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            title="Copy Content"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          {!isUser && (
            <button
              type="button"
              onClick={() => downloadReport(message.content)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-muted hover:text-emerald-500 hover:bg-surface-hover transition-colors"
              title="Download Markdown Report"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export MD</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 min-w-0">
        {isUser ? (
          <div className="space-y-2">
            {message.code ? (
              <div className="rounded-xl border border-border/80 bg-zinc-950 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[10px] font-mono text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <FileCode size={12} />
                    <span>Source Payload</span>
                  </span>
                  <span>{codeLines} lines</span>
                </div>
                <div className={`relative overflow-x-auto ${isLongCode && !isExpanded ? 'max-h-72 overflow-hidden' : ''}`}>
                  <pre className="p-4 font-mono text-[12px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    <code>{message.code}</code>
                  </pre>
                  {isLongCode && !isExpanded && (
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
                  )}
                </div>
                {isLongCode && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors border-t border-zinc-800"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp size={14} /> Collapse Code
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} /> Show Full Code ({codeLines} lines)
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-foreground text-sm sm:text-base font-medium leading-relaxed">
                {message.content}
              </p>
            )}
          </div>
        ) : (
          <div className="prose prose-zinc dark:prose-invert max-w-none text-foreground/90 text-[13px] sm:text-[14px] leading-[1.8] font-normal tracking-tight">
            <ReactMarkdown
              components={{
                code: CodeBlock,
                pre: ({ children }) => <>{children}</>,
                p: ({ ...props }) => <p className="mb-4 last:mb-0 leading-relaxed" {...props} />,
                h1: ({ ...props }) => (
                  <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mt-6 mb-3 font-display border-b border-border/80 pb-2" {...props} />
                ),
                h2: ({ ...props }) => (
                  <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight mt-5 mb-2 font-display text-emerald-600 dark:text-emerald-400" {...props} />
                ),
                h3: ({ ...props }) => (
                  <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight mt-4 mb-2 font-display" {...props} />
                ),
                ul: ({ ...props }) => <ul className="list-disc list-outside pl-5 mb-4 space-y-1" {...props} />,
                ol: ({ ...props }) => <ol className="list-decimal list-outside pl-5 mb-4 space-y-1" {...props} />,
                li: ({ ...props }) => <li className="pl-1" {...props} />,
                blockquote: ({ ...props }) => (
                  <blockquote
                    className="border-l-3 border-emerald-500 pl-4 my-4 italic text-muted/90 bg-emerald-500/[0.04] py-3 rounded-r-xl text-xs sm:text-[13px]"
                    {...props}
                  />
                ),
                table: ({ ...props }) => (
                  <div className="overflow-x-auto my-4 rounded-xl border border-border">
                    <table className="w-full text-left text-xs border-collapse" {...props} />
                  </div>
                ),
                th: ({ ...props }) => (
                  <th className="bg-surface-hover p-2.5 font-bold border-b border-border text-foreground uppercase tracking-wider text-[10px]" {...props} />
                ),
                td: ({ ...props }) => (
                  <td className="p-2.5 border-b border-border/50 text-muted" {...props} />
                )
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
};
