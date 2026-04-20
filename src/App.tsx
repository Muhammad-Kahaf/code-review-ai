import { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { googleLogout } from '@react-oauth/google';
import Prism from 'prismjs';
import { PanelLeft, Sun, Moon, Settings } from 'lucide-react';

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

// Types
import type { User } from './types';

// Config
import { GROQ_API_KEY } from './config';

export default function App() {
  const {
    user, setUser,
    githubToken, setGithubToken,
    sessions, setSessions,
    activeId, setActiveId
  } = usePersistence();

  const { isDark, setIsDark } = useTheme();
  const [apiKey, setApiKey] = useState(GROQ_API_KEY);

  const {
    code, setCode,
    isReviewing,
    focusModes, setFocusModes,
    error,
    lang,
    createNewChat,
    deleteSession,
    handleReview,
    handleRepoSelect,
    handlePRSelect
  } = useChat(sessions, setSessions, activeId, setActiveId, apiKey, githubToken);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSession = sessions.find(s => s.id === activeId);

  // Syntax highlighting trigger
  useEffect(() => {
    Prism.highlightAll();
  }, [sessions, isReviewing]);

  const handleLogin = (userData: User) => setUser(userData);

  const handleLogout = () => {
    googleLogout();
    setUser(null);
    localStorage.removeItem('review_user');
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background theme-transition">
      <AnimatePresence>
        {!user && <Login onLogin={handleLogin} />}
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
        apiKey={apiKey}
        setApiKey={setApiKey}
        githubToken={githubToken}
        setGithubToken={setGithubToken}
        lang={lang}
      />

      <Sidebar 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        user={user}
        sessions={sessions}
        activeId={activeId}
        setActiveId={setActiveId}
        createNewChat={createNewChat}
        deleteSession={deleteSession}
        handleLogout={handleLogout}
        lang={lang}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-full">
        <header className="h-16 shrink-0 flex items-center justify-between px-6 md:px-12 border-b border-border bg-background z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-all duration-300 border border-transparent hover:border-border"
              aria-label="Toggle sidebar"
            >
              <PanelLeft size={18} />
            </button>
            <h2 className="text-xs font-black text-foreground uppercase tracking-[0.25em] px-2 border-l border-border h-4 flex items-center ml-2">
              {activeSession ? activeSession.title : 'Overview'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDark(!isDark)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border hover:border-emerald-500/30 text-muted hover:text-foreground transition-all duration-300 text-[10px] font-black uppercase tracking-widest"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              {isDark ? 'Light' : 'Dark'}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full bg-surface border border-border hover:border-emerald-500/30 text-muted hover:text-foreground transition-all duration-300 shadow-sm"
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        <ChatArea 
          activeSession={activeSession}
          activeId={activeId}
          isReviewing={isReviewing}
          downloadReport={downloadReport}
        />

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
        />
      </main>
    </div>
  );
}
