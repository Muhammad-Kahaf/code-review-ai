import { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { googleLogout } from '@react-oauth/google';
import { Routes, Route, useLocation } from 'react-router-dom';
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
import { AgentService } from './services/agentService';

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
  const { pathname } = useLocation();
  const sessionId = pathname.startsWith('/chat/') ? pathname.split('/')[2] : undefined;

  const {
    user, setUser,
    githubToken, setGithubToken,
    sessions, setSessions,
    isLoadingSessions
  } = usePersistence(sessionId);

  const { isDark, setIsDark } = useTheme();
  const [apiKey, setApiKey] = useState(GROQ_API_KEY);

  const {
    code, setCode,
    isReviewing,
    isLoadingMessages,
    focusModes, setFocusModes,
    error,
    lang,
    activeId,
    createNewChat,
    deleteSession,
    handleReview,
    handleRepoSelect,
    handlePRSelect
  } = useChat(user, sessions, setSessions, apiKey, githubToken);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isAgentProcessing, setIsAgentProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSession = sessions.find(s => s.id === activeId);

  useEffect(() => {
    Prism.highlightAll();
  }, [sessions, isReviewing]);

  // Autonomous Agent Polling (Every 5 minutes)
  useEffect(() => {
    if (!user || !githubToken || !apiKey) return;

    const runAgent = async () => {
      setIsAgentProcessing(true);
      try {
        await AgentService.processAllAgents(user.email, githubToken, apiKey);
      } catch (e) {
        console.error(e);
      } finally {
        setIsAgentProcessing(false);
      }
    };

    runAgent(); // Initial run
    const interval = setInterval(runAgent, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.email, githubToken, apiKey]);

  const handleLogin = (userData: User, token?: string) => {
    console.log("App handleLogin called with:", { userData, token: token ? "EXISTS" : "MISSING" });
    setUser(userData);
    if (token) {
      console.log("App setting githubToken:", token.substring(0, 5) + "...");
      setGithubToken(token);
    }
  };

  const handleLogout = () => {
    googleLogout();
    setUser(null);
    localStorage.clear(); // Clear all (v1, v2 and user)
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

  const renderContent = () => (
    <div className="flex-1 flex flex-col relative overflow-hidden h-full">
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
          {isAgentProcessing && (
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 ml-4 animate-pulse">
               <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
               <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest">Brain Active</span>
            </div>
          )}
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
        isLoadingMessages={isLoadingMessages}
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
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background theme-transition">
      <AnimatePresence>
        {!user && <Login onLogin={handleLogin} />}
      </AnimatePresence>

      <GithubRepoModal
        isOpen={showGithubModal}
        onClose={() => setShowGithubModal(false)}
        userEmail={user?.email}
        githubToken={githubToken}
        provider={user?.provider}
        onSelectRepo={handleRepoSelect}
        onSelectPR={handlePRSelect}
        isAgentProcessing={isAgentProcessing}
      />

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        githubToken={githubToken}
        setGithubToken={setGithubToken}
        lang={lang}
        user={user}
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
        lang={lang}
      />

      <Routes>
        <Route path="/" element={renderContent()} />
        <Route path="/chat/:sessionId" element={renderContent()} />
      </Routes>
    </div>
  );
}
