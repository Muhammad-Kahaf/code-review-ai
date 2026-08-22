import { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { googleLogout } from '@react-oauth/google';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Prism from 'prismjs';
import { Menu, Sun, Moon, Settings, Share2, LogIn } from 'lucide-react';

// Styles
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-diff';

// Hooks
import { usePersistence } from './hooks/usePersistence';
import { useTheme } from './hooks/useTheme';
import { useChat } from './hooks/useChat';

// Components
import { Login } from './components/auth/Login';
import { Sidebar } from './components/layout/Sidebar';
import { ChatArea } from './components/chat/ChatArea';
import { CommandBar } from './components/chat/CommandBar';
import { GithubRepoModal } from './components/modals/GithubRepoModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { Logo } from './components/common/Logo';

// Types
import type { User } from './types';

export default function App() {
  const {
    user, setUser,
    githubToken, setGithubToken,
    sessions, setSessions,
    isLoadingSessions
  } = usePersistence();

  const { isDark, setIsDark } = useTheme();

  const {
    code, setCode,
    isReviewing,
    isLoadingMessages,
    focusModes, setFocusModes,
    error, setError,
    activeId,
    createNewChat,
    deleteSession,
    handleReview,
    handleRepoSelect,
    handlePRSelect
  } = useChat(user, sessions, setSessions, githubToken);

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return false; // Mobile par refresh par kabhi khula nahi aayega
    }
    const saved = localStorage.getItem('review_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  // Save preference for desktop
  useEffect(() => {
    if (window.innerWidth >= 768) {
      localStorage.setItem('review_sidebar_open', String(sidebarOpen));
    }
  }, [sidebarOpen]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const [showSettings, setShowSettings] = useState(false);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSession = sessions.find(s => s.id === activeId);

  // Syntax highlighting trigger
  useEffect(() => {
    Prism.highlightAll();
  }, [sessions, isReviewing]);

  const navigate = useNavigate();

  const handleLogin = (userData: User) => setUser(userData);

  const handleLogout = () => {
    googleLogout();
    setUser(null);
    localStorage.clear();
    navigate('/', { replace: true });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const readFiles = Array.from(files).map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result;
          if (typeof content === 'string') {
            resolve(`// --- File: ${file.name} ---\n${content}`);
          } else {
            resolve(`// --- failed to read ${file.name} ---`);
          }
        };
        reader.readAsText(file);
      });
    });

    const fileContents = await Promise.all(readFiles);
    setCode((prev) => prev + (prev ? '\n\n' : '') + fileContents.join('\n\n'));
    e.target.value = '';
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload({ target: { files } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const downloadReport = (content: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-review-${new Date().getTime()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CodeReview.AI Analysis',
          url: window.location.href
        });
      } catch {
        // ignore
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Review link copied to clipboard!');
    }
  };

  const renderContent = () => (
    <div className="flex-1 flex flex-col relative overflow-hidden h-full w-full">
      {/* Header Bar */}
      <header className="h-14 sm:h-16 shrink-0 flex items-center justify-between px-3 sm:px-6 md:px-8 border-b border-border bg-surface/95 backdrop-blur-md z-30 w-full">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all duration-200 cursor-pointer shrink-0"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu size={18} />
          </button>

          <Logo size={26} className="shrink-0" />
          
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h2 className="text-xs sm:text-sm font-bold text-foreground truncate">
              {activeSession ? activeSession.title : 'New Review'}
            </h2>
            {activeSession && (
              <span className="hidden sm:inline-block text-[9px] font-mono px-2 py-0.5 rounded-md bg-surface-hover border border-border text-muted shrink-0">
                {activeSession.messages.length} msgs
              </span>
            )}
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {activeSession && (
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all cursor-pointer"
              title="Share Review Session"
            >
              <Share2 size={16} />
            </button>
          )}

          {/* Guest Sign In Button */}
          {!user && (
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all text-[11px] sm:text-xs font-bold shadow-xs cursor-pointer"
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-background border border-border hover:border-emerald-500/30 text-muted hover:text-foreground transition-all text-xs font-semibold cursor-pointer"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
            <span className="text-[10px] uppercase tracking-wider font-bold hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
          </button>

          {/* Settings Trigger */}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-xl bg-background border border-border hover:border-emerald-500/30 text-muted hover:text-foreground transition-all cursor-pointer"
            title="System Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Main Chat Stream */}
      <ChatArea 
        activeSession={activeSession}
        activeId={activeId}
        isReviewing={isReviewing}
        isLoadingMessages={isLoadingMessages}
        downloadReport={downloadReport}
        onSelectPrompt={(sampleCode) => setCode(sampleCode)}
      />

      {/* Command & Input Bar */}
      <CommandBar 
        code={code}
        setCode={setCode}
        isReviewing={isReviewing}
        handleReview={handleReview}
        error={error}
        focusModes={focusModes}
        setFocusModes={setFocusModes}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        onDrop={onDrop}
        handleFileUpload={handleFileUpload}
        fileInputRef={fileInputRef}
        setShowGithubModal={setShowGithubModal}
        onClearError={() => setError('')}
      />
    </div>
  );

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background theme-transition">
      <AnimatePresence>
        {showLoginModal && (
          <Login 
            onLogin={(userData) => {
              handleLogin(userData);
              setShowLoginModal(false);
            }} 
            onContinueGuest={() => setShowLoginModal(false)}
          />
        )}
      </AnimatePresence>

      <GithubRepoModal
        isOpen={showGithubModal}
        onClose={() => setShowGithubModal(false)}
        githubToken={githubToken}
        onSelectRepo={handleRepoSelect}
        onSelectPR={handlePRSelect}
      />

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        githubToken={githubToken}
        setGithubToken={setGithubToken}
      />

      <Sidebar 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        user={user}
        sessions={sessions}
        isLoading={isLoadingSessions}
        activeId={activeId}
        createNewChat={createNewChat}
        deleteSession={deleteSession}
        handleLogout={handleLogout}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full w-full overflow-hidden relative">
        <Routes>
          <Route path="/" element={renderContent()} />
          <Route path="/chat/:sessionId" element={renderContent()} />
        </Routes>
      </main>
    </div>
  );
}
