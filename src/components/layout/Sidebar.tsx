import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  LogOut, 
  LogIn, 
  Search,
  Calendar,
  X
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { User, ChatSession } from '../../types';
import { Logo } from '../common/Logo';
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
  onOpenLogin?: () => void;
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
  onOpenLogin
}: SidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter sessions by search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(s => s.title.toLowerCase().includes(q));
  }, [sessions, searchQuery]);

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const groups: { [key: string]: ChatSession[] } = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: []
    };

    filteredSessions.forEach(session => {
      const diff = now - session.createdAt;
      if (diff < oneDay) {
        groups.Today.push(session);
      } else if (diff < 2 * oneDay) {
        groups.Yesterday.push(session);
      } else if (diff < 7 * oneDay) {
        groups['Previous 7 Days'].push(session);
      } else {
        groups.Older.push(session);
      }
    });

    return groups;
  }, [filteredSessions]);

  const renderSessionList = (isMobile = false) => {
    // When NOT logged in: show clean humanized prompt like ChatGPT / Claude
    if (!user) {
      return (
        <div className="space-y-4 px-3 py-6 text-center my-auto">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-foreground">Sign in to save chats</p>
            <p className="text-[11px] text-muted leading-relaxed">
              Save your review history and sync across devices by signing in.
            </p>
          </div>
          {onOpenLogin && (
            <button
              type="button"
              onClick={() => {
                if (isMobile) setIsOpen(false);
                onOpenLogin();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Sign in with Google
            </button>
          )}
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="space-y-2 px-1 py-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-full bg-surface-hover animate-pulse rounded-xl" />
          ))}
        </div>
      );
    }

    if (filteredSessions.length === 0) {
      return (
        <div className="px-3 py-8 text-center border border-dashed border-border rounded-xl bg-background/40 my-4">
          <p className="text-xs text-muted font-medium">
            {searchQuery ? 'No matching reviews' : 'No review history yet'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4 py-2">
        {Object.entries(groupedSessions).map(([groupName, groupItems]) => {
          if (groupItems.length === 0) return null;
          return (
            <div key={groupName} className="space-y-1">
              <p className="px-2 text-[10px] font-mono font-bold text-muted/60 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={11} />
                {groupName}
              </p>
              <div className="space-y-0.5">
                {groupItems.map(s => (
                  <NavLink
                    key={s.id}
                    to={`/chat/${s.id}`}
                    onClick={() => isMobile && setIsOpen(false)}
                    className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer group transition-all duration-150 border text-left ${
                      isActive
                        ? 'bg-zinc-100 dark:bg-zinc-800/80 border-border text-foreground font-semibold'
                        : 'border-transparent text-muted hover:bg-surface-hover hover:text-foreground'
                    }`}
                  >
                    <MessageSquare size={14} className={`shrink-0 ${activeId === s.id ? 'text-emerald-500' : 'text-muted/60 group-hover:text-foreground'}`} />
                    <span className="text-xs truncate flex-1 font-medium">{s.title}</span>
                    <button
                      type="button"
                      onClick={(e) => deleteSession(e, s.id)}
                      className={`p-1 rounded-md transition-all shrink-0 ${
                        activeId === s.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      } hover:text-red-500 hover:bg-red-500/10 cursor-pointer`}
                      title="Delete review"
                    >
                      <Trash2 size={13} />
                    </button>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 260 : 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="hidden md:flex flex-col bg-surface border-r border-border text-foreground overflow-hidden z-30 shadow-xl relative select-none"
      >
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border bg-surface/90 backdrop-blur-md shrink-0">
          <Logo size={26} />
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-black text-foreground tracking-tight font-display">
              CodeReview<span className="text-emerald-500">.AI</span>
            </h1>
          </div>
        </div>

        {/* Action & Search: ONLY WHEN LOGGED IN */}
        {user && (
          <div className="p-3 space-y-2 shrink-0 border-b border-border/50">
            <button
              type="button"
              onClick={createNewChat}
              className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold rounded-xl transition-all shadow-xs group cursor-pointer"
            >
              <span className="text-xs tracking-wide font-bold flex items-center gap-2 font-mono">
                <Plus size={14} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform" />
                New Audit
              </span>
              <span className="text-[9px] font-mono font-normal opacity-60">⌘N</span>
            </button>

            {/* Search Box */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter sessions..."
                className="w-full pl-8 pr-7 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted/50 outline-none focus:border-zinc-500 transition-all font-mono"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* History List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-2">
          {renderSessionList()}
        </div>

        {/* User Footer */}
        <div className="p-3 bg-surface border-t border-border shrink-0">
          {user ? (
            <div className="flex items-center gap-2.5 p-1.5 rounded-xl bg-background border border-border">
              <img src={user.avatar} alt="User" className="w-7 h-7 rounded-lg ring-1 ring-border shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-foreground truncate">{user.name}</p>
                <p className="text-[9px] font-medium text-muted truncate">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0 cursor-pointer"
                title="Log out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-background hover:bg-surface-hover border border-border text-foreground text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <LogIn size={13} className="text-emerald-500" />
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </motion.aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-[85%] max-w-[300px] bg-surface border-r border-border z-50 flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-surface shrink-0">
                <div className="flex items-center gap-2.5">
                  <Logo size={28} />
                  <h1 className="text-sm font-black text-foreground font-display">
                    CodeReview<span className="text-emerald-500">.AI</span>
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mobile Actions: ONLY WHEN LOGGED IN */}
              {user && (
                <div className="p-3 space-y-2 shrink-0 border-b border-border/50">
                  <button
                    type="button"
                    onClick={() => { createNewChat(); setIsOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold rounded-xl shadow-xs transition-all text-xs uppercase tracking-wider cursor-pointer font-mono"
                  >
                    <Plus size={15} strokeWidth={2.5} />
                    <span>New Audit</span>
                  </button>

                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter sessions..."
                      className="w-full pl-8 pr-7 py-2 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted/50 outline-none focus:border-zinc-500 transition-all font-mono"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile History */}
              <div className="flex-1 overflow-y-auto scrollbar-hide px-2">
                {renderSessionList(true)}
              </div>

              {/* Mobile Footer */}
              <div className="p-3 border-t border-border bg-surface shrink-0">
                {user ? (
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-background border border-border">
                    <img src={user.avatar} alt="User" className="w-8 h-8 rounded-lg ring-1 ring-border shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
                      <p className="text-[10px] text-muted truncate">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        handleLogout();
                      }}
                      className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenLogin && onOpenLogin();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <LogIn size={15} />
                    <span>Sign in with Google</span>
                  </button>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
