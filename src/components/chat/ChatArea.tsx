import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader } from 'lucide-react';
import type { ChatSession } from '../../types';
import { MessageItem } from './MessageItem';

interface ChatAreaProps {
  activeSession: ChatSession | undefined;
  activeId: string | null | undefined;
  isReviewing: boolean;
  isLoadingMessages: boolean;
  downloadReport: (content: string) => void;
}

export const ChatArea = ({
  activeSession,
  activeId,
  isReviewing,
  isLoadingMessages,
  downloadReport
}: ChatAreaProps) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession, isReviewing]);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-10">
      <div className="w-full max-w-3xl mx-auto px-6 space-y-12">
        {(!activeId || (activeSession && activeSession.messages.length === 0)) && !isReviewing && !isLoadingMessages && (
          <div className="min-h-[40vh] flex flex-col items-center justify-center text-center space-y-10">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 shadow-sm"
            >
              <Sparkles size={40} strokeWidth={1.5} />
            </motion.div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-foreground tracking-tighter font-display leading-tight">
                {activeId ? "Protocol Initialized" : "Universal Code Intelligence"}
              </h2>
              <p className="text-muted text-lg font-medium leading-relaxed max-w-md mx-auto opacity-60">
                Deploy your code or repository link for a full security and logic audit.
              </p>
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {isLoadingMessages ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 space-y-4">
               <Loader size={32} className="animate-spin text-emerald-500" />
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Retrieving History...</p>
            </motion.div>
          ) : (
            activeSession?.messages.map((msg, i) => (
              <MessageItem 
                key={i} 
                message={msg} 
                downloadReport={downloadReport} 
              />
            ))
          )}

          {isReviewing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-emerald-500 py-10">
              <Loader size={16} className="animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Processing Logic...</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} className="h-40" />
      </div>
    </div>
  );
};
