import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  LogOut, 
  Globe, 
  Search,
  Calendar,
  X,
  Sparkles
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
  const [searchQuery, setSearchQuery] = useState('');

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
    if (isLoading) {
      return (
        <div className="space-y-2.5 px-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-full bg-surface-hover animate-pulse rounded-xl" />
          ))}
        </div>
      );
    }

    if (filteredSessions.length === 0) {
      return (
        <div className="px-3 py-8 text-center border border-dashed border-border rounded-xl bg-background/50">
          <p className="text-[11px] text-muted font-semibold">
            {searchQuery ? 'No matching reviews found' : 'No review history yet'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {Object.entries(groupedSessions).map(([groupName, groupItems]) => {
          if (groupItems.length === 0) return null;
          return (
            <div key={groupName} className="space-y-1.5">
              <p className="px-2 text-[10px] font-black text-muted/60 uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Calendar size={11} />
                {groupName}
              </p>
              <div className="space-y-1">
                {groupItems.map(s => (
                  <NavLink
                    key={s.id}
                    to={`/chat/${s.id}`}
                    onClick={() => isMobile && setIsOpen(false)}
                    className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer group transition-all duration-150 border text-left ${
                      isActive
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'border-transparent text-muted hover:bg-surface-hover hover:text-foreground'
                    }`}
                  >
                    <MessageSquare size={14} className={`shrink-0 ${activeId === s.id ? 'text-emerald-500' : 'text-muted/60 group-hover:text-emerald-500/70'}`} />
                    <span className="text-xs truncate flex-1 font-medium tracking-tight">{s.title}</span>
                    <button
                      type="button"
                      onClick={(e) => deleteSession(e, s.id)}
                      className={`p-1 rounded-md transition-all shrink-0 ${
                        activeId === s.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      } hover:text-red-500 hover:bg-red-500/10`}
                      title="Delete review session"
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
        animate={{ width: isOpen ? 280 : 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="hidden md:flex flex-col bg-surface border-r border-border text-foreground overflow-hidden z-30 shadow-xl relative select-none"
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-border bg-surface/80 backdrop-blur-md shrink-0">
          <Logo size={32} />
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-black text-foreground tracking-tight font-display flex items-center gap-1">
              CodeReview<span className="text-emerald-500">.AI</span>
              <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 ml-auto">PRO</span>
            </h1>
          </div>
        </div>

        {/* Action & Search */}
        <div className="p-3 space-y-3 shrink-0">
          <button
            type="button"
            onClick={createNewChat}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 group cursor-pointer"
          >
            <span className="text-xs uppercase tracking-wider font-extrabold flex items-center gap-2">
              <Plus size={15} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform" />
              New Analysis
            </span>
            <Sparkles size={14} className="opacity-80" />
          </button>

          {/* Search Box */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviews..."
              className="w-full pl-8 pr-7 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted/50 outline-none focus:border-emerald-500/50 transition-all font-medium"
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

        {/* History List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-1">
          {renderSessionList()}
        </div>

        {/* User Footer */}
        <div className="p-3 bg-surface border-t border-border space-y-2 shrink-0">
          {user ? (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-background border border-border shadow-xs">
              <img src={user.avatar} alt="User" className="w-8 h-8 rounded-lg ring-1 ring-border shadow-xs shrink-0" />
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
            <div className="flex items-center justify-between p-2 rounded-xl bg-background border border-border text-muted text-[10px] font-bold">
              <span>Guest Session Mode</span>
              <span className="text-emerald-500">Local Active</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-background border border-border text-[9px] font-bold uppercase text-muted tracking-wider">
            <Globe size={11} className="text-emerald-500" />
            <span className="truncate">{lang} Mode</span>
          </div>
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
              className="md:hidden fixed left-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-surface border-r border-border z-50 flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-surface shrink-0">
                <div className="flex items-center gap-2.5">
                  <Logo size={32} />
                  <h1 className="text-base font-black text-foreground font-display">
                    CodeReview<span className="text-emerald-500">.AI</span>
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mobile Actions */}
              <div className="p-4 space-y-3 shrink-0">
                <button
                  type="button"
                  onClick={() => { createNewChat(); setIsOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-500/25 transition-all text-xs uppercase tracking-wider cursor-pointer"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  New Review
                </button>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reviews..."
                    className="w-full pl-9 pr-7 py-2 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted/50 outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile History */}
              <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-1">
                {renderSessionList(true)}
              </div>

              {/* Mobile Footer */}
              <div className="p-4 border-t border-border bg-surface/50 space-y-3 shrink-0">
                {user ? (
                  <div className="p-2.5 rounded-xl bg-background border border-border flex items-center gap-3">
                    <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
                      <p className="text-[10px] text-muted truncate">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-background border border-border text-center text-xs text-muted">
                    Guest Mode Active
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
