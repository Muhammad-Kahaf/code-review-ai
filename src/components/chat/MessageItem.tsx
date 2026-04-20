import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../../types';
import { CodeBlock } from '../common/CodeBlock';
import { CopyButton } from '../common/CopyButton';

interface MessageItemProps {
  message: Message;
  downloadReport: (content: string) => void;
}

export const MessageItem = ({ message, downloadReport }: MessageItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col gap-4 ${message.role === 'assistant' ? 'bg-surface/30 -mx-6 px-6 py-10 border-y border-border/50' : 'py-2'}`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-black ${message.role === 'user' ? 'bg-zinc-900' : 'bg-emerald-500'}`}>
            {message.role === 'user' ? 'U' : 'A'}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${message.role === 'user' ? 'text-muted' : 'text-emerald-500'}`}>
            {message.role === 'user' ? 'Source Input' : 'Agent Response'}
          </span>
        </div>
        {message.role === 'user' && message.code && <CopyButton text={message.code} className="scale-75" />}
      </div>

      <div className="flex-1 min-w-0">
        {message.role === 'user' ? (
          <div className="space-y-4">
            {message.code ? (
              <div className="rounded-xl border border-border bg-zinc-950 overflow-hidden shadow-sm">
                <pre className="p-5 font-mono text-[12px] text-zinc-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                  <code>{message.code}</code>
                </pre>
              </div>
            ) : (
              <p className="text-foreground text-lg font-medium leading-relaxed">{message.content}</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="prose prose-zinc dark:prose-invert max-w-none text-foreground/90 text-[15px] leading-[1.8] font-normal tracking-tight">
              <ReactMarkdown
                components={{
                  code: CodeBlock,
                  pre: ({ children }) => <>{children}</>,
                  p: ({ ...props }) => <p className="mb-6 last:mb-0" {...props} />,
                  h1: ({ ...props }) => <h1 className="text-2xl font-black text-foreground tracking-tighter mt-10 mb-4 font-display" {...props} />,
                  h2: ({ ...props }) => <h2 className="text-xl font-bold text-foreground tracking-tight mt-8 mb-3 font-display border-b border-border pb-2" {...props} />,
                  blockquote: ({ ...props }) => (
                    <blockquote className="border-l-2 border-emerald-500 pl-6 my-8 italic text-muted/80 bg-emerald-500/[0.02] py-4 rounded-r-xl" {...props} />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-border/40 opacity-40 group-hover:opacity-100 transition-opacity">
              <span className="text-[9px] font-black uppercase tracking-widest">{message.timestamp}</span>
              <div className="flex items-center gap-3">
                <button onClick={() => downloadReport(message.content)} className="hover:text-emerald-500 transition-colors">
                  <Download size={14} />
                </button>
                <CopyButton text={message.content} className="border-none bg-transparent shadow-none p-0 hover:text-emerald-500" />
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
