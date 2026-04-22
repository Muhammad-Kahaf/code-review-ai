import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Plus, 
  History, 
  MessageSquare, 
  Trash2, 
  LogOut, 
  Globe 
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { User, ChatSession } from '../../types';
import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  user: User | null;
  sessions: ChatSession[];
  isLoading?: boolean;
  activeId?: string | null;
  createNewChat: () => void;
  deleteSession: (e: React.MouseEvent, id: string) => void;
  handleLogout: () => void;
  lang: string;
}

export const Sidebar = ({
  isOpen,
  setIsOpen,
  user,
  sessions,
  isLoading = false,
  activeId,
  createNewChat,
  deleteSession,
  handleLogout,
  lang
}: SidebarProps) => {
  const renderSessions = () => {
    if (isLoading) {
      return (
        <div className="space-y-3 px-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-full bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
          ))}
        </div>
      );
    }

    if (sessions.length === 0) {
      return (
        <div className="px-3 py-6 text-center border border-dashed border-border rounded-xl bg-background/50">
          <p className="text-[10px] text-muted uppercase tracking-widest font-black leading-relaxed">System Idle</p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {sessions.map((s) => (
          <NavLink
            key={s.id}
            to={`/chat/${s.id}`}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group transition-all duration-200 border ${isActive
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-muted hover:bg-surface-hover hover:text-foreground'
              }`}
          >
            <MessageSquare size={14} className={activeId === s.id ? 'text-emerald-500' : 'text-muted/60 group-hover:text-emerald-500/50'} />
            <span className="text-xs truncate flex-1 font-bold tracking-tight">{s.title}</span>
            <button
              type="button"
              onClick={(e) => deleteSession(e, s.id)}
              className={`p-1 rounded-md transition-all ${activeId === s.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} hover:text-red-500 hover:bg-red-500/10`}
            >
              <Trash2 size={12} />
            </button>
          </NavLink>
        ))}
      </div>
    );
  };

  const renderMobileSessions = () => {
    if (isLoading) {
      return (
        <div className="space-y-3 px-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 w-full bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      );
    }

    if (sessions.length === 0) {
      return (
        <div className="px-4 py-12 text-center border-2 border-dashed rounded-2xl">
          <p className="text-xs text-muted italic font-medium">No reviews found.</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {sessions.map((s) => (
          <NavLink
            key={s.id}
            to={`/chat/${s.id}`}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 p-3.5 rounded-xl cursor-pointer group transition-all duration-200 border ${isActive
              ? 'bg-emerald-500/10 border-emerald-500/50 text-foreground ring-1 ring-emerald-500/20'
              : 'border-transparent text-muted hover:bg-surface-hover hover:text-foreground'
              }`}
          >
            <MessageSquare size={16} className={`shrink-0 ${activeId === s.id ? 'text-emerald-500' : 'text-slate-400'}`} />
            <span className="text-sm truncate flex-1 font-semibold tracking-tight">{s.title}</span>
            <button
              onClick={(e) => deleteSession(e, s.id)}
              className={`p-1.5 rounded-lg transition-all ${activeId === s.id ? 'opacity-100' : 'opacity-0'} hover:text-red-500 hover:bg-red-500/10`}
            >
              <Trash2 size={14} />
            </button>
          </NavLink>
        ))}
      </div>
    );
  };
  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 260 : 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="hidden md:flex flex-col bg-surface border-r border-border text-foreground overflow-hidden z-30 shadow-2xl relative"
      >
        <div className="flex items-center gap-3 px-6 h-16 border-b border-border bg-surface/50 backdrop-blur-md">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
            <Cpu size={18} strokeWidth={1.5} />
          </div>
          <h1 className="text-sm font-black text-foreground tracking-tighter uppercase font-display leading-none">CodeReview<span className="text-emerald-500">.AI</span></h1>
        </div>

        <div className="flex-1 flex flex-col p-3 pt-6 overflow-y-auto scrollbar-hide space-y-8">
          <button
            onClick={createNewChat}
            className="group w-full flex items-center justify-between px-4 py-3 bg-background hover:bg-surface-hover border border-border rounded-xl transition-all shadow-sm"
          >
            <span className="text-xs font-bold text-foreground uppercase tracking-widest">New Review</span>
            <Plus size={16} className="text-muted group-hover:text-emerald-500 transition-colors" />
          </button>

          <div className="space-y-4">
            <p className="px-3 text-[10px] items-center gap-2 flex font-black text-muted uppercase tracking-[0.3em]">
              <History size={12} strokeWidth={2.5} />
              Archives
            </p>
            {renderSessions()}
          </div>
        </div>

        <div className="p-4 bg-surface border-t border-border space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-2 py-2">
              <img src={user.avatar} alt="User" className="w-8 h-8 rounded-lg ring-1 ring-border shadow-sm" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-foreground truncate tracking-tight">{user.name}</p>
                <p className="text-[9px] font-bold text-muted truncate uppercase tracking-widest leading-none mt-0.5">{user.email.split('@')[0]}</p>
              </div>
              <button onClick={handleLogout} className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-all">
                <LogOut size={14} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-background rounded-xl border border-border text-[10px] font-black uppercase text-muted tracking-widest">
            <Globe size={12} className="text-emerald-500" />
            <span className="truncate">{lang} Protocol</span>
          </div>
        </div>
      </motion.aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden fixed left-0 top-0 h-screen w-[300px] bg-surface border-r z-50 flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="flex items-center gap-4 p-6 border-b">
                <div className="p-2.5 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 text-white shadow-lg shrink-0">
                  <Cpu size={26} />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-black text-foreground tracking-tight font-display">CodeReview<span className="text-emerald-500">.AI</span></h1>
                  <p className="text-xs text-muted font-bold uppercase tracking-widest">Mobile Agent</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide space-y-6 p-6">
                <button
                  onClick={() => { createNewChat(); setIsOpen(false); }}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-500/25 active:scale-95 group"
                >
                  <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                  New Analysis
                </button>

                <div className="space-y-4">
                  <p className="px-2 text-xs font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                    <History size={14} className="text-emerald-500" />
                    Review History
                  </p>
                  {renderMobileSessions()}
                </div>
              </div>

              <div className="space-y-4 p-6 border-t bg-surface/50">
                {user && (
                  <div className="p-3.5 rounded-2xl bg-background border flex items-center gap-4 shadow-sm">
                    <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-xl bg-surface shadow-md shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 rounded-xl hover:bg-red-500/10 hover:text-red-500 text-muted transition-all shrink-0"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background border text-xs text-muted">
                  <Globe size={16} className="text-emerald-500 shrink-0" />
                  <span className="truncate font-bold tracking-wide uppercase">{lang} MODE</span>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
