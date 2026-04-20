import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Cpu,
  Sparkles,
  Send,
  Plus,
  History,
  MessageSquare,
  Trash2,
  LogOut,
  Settings,
  Sun,
  Moon,
  PanelLeft,
  Paperclip,
  Key,
  Globe,
  Download,
  Shield,
  Zap,
  Loader,
  Copy,
  Check,
  GitForkIcon,
  FolderGit2,
  Lock,
  Search,
  X,
  GitPullRequest,
  ChevronLeft,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import Prism from 'prismjs';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { Octokit } from '@octokit/rest';

// Import Prism styles & components
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-diff';
import axios from 'axios';

// --- Configuration ---
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// --- Types ---
interface Message {
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  focusModes: string[];
  createdAt: number;
}

interface User {
  name: string;
  email: string;
  avatar: string;
}

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  updated_at: string | null;
}

interface GithubPR {
  id: number;
  number: number;
  title: string;
  html_url: string;
  created_at: string;
  user: { login: string };
  head: { ref: string; sha: string };
}

// --- Components ---
const Login = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-6 theme-transition overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md space-y-10"
      >
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20"
          >
            <Cpu size={32} strokeWidth={1.5} />
          </motion.div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-foreground tracking-tighter font-display">
              CodeReview<span className="text-emerald-500">.AI</span>
            </h1>
            <p className="text-muted text-base font-medium font-sans">
              Enter the next generation of code intelligence.
            </p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-[32px] p-8 shadow-sm space-y-6">
          <div className="flex flex-col items-center justify-center">
            <div className="w-full h-14 flex items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-zinc-900 border border-border shadow-sm hover:border-emerald-500/50 transition-all duration-300">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  const decoded = jwtDecode<Record<string, unknown>>(credentialResponse.credential!);
                  onLogin({
                    name: decoded.name as string,
                    email: decoded.email as string,
                    avatar: decoded.picture as string
                  });
                }}
                onError={() => setError("Authentication failed. Please try again.")}
                useOneTap
                theme="outline"
                size="large"
                shape="rectangular"
              />
            </div>
            {error && (
              <p className="mt-4 text-[11px] font-bold text-red-500 uppercase tracking-widest">{error}</p>
            )}
          </div>

          <div className="pt-6 border-t border-border flex flex-col gap-4 text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/60">Ready to audit production codebases?</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 text-muted/40">
          <Shield size={20} strokeWidth={1.5} />
          <Zap size={20} strokeWidth={1.5} />
          <Globe size={20} strokeWidth={1.5} />
        </div>
      </motion.div>
    </div>
  );
};
const CodeBlock = ({ children, className, ...props }: React.ComponentProps<'code'> & { className?: string }) => {
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

const CopyButton = ({ text, className = '' }: { text: string; className?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.9 }}
      className={`p-1.5 rounded-lg bg-surface border border-border hover:border-emerald-500/20 transition-all duration-300 flex items-center justify-center text-muted hover:text-emerald-500 shadow-xs ${className}`}
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check size={14} className="text-emerald-500" />
      ) : (
        <Copy size={14} />
      )}
    </motion.button>
  );
};

const GithubRepoModal = ({
  isOpen,
  onClose,
  githubToken,
  onSelectRepo,
  onSelectPR
}: {
  isOpen: boolean;
  onClose: () => void;
  githubToken: string;
  onSelectRepo: (owner: string, repo: string, defaultBranch: string) => void;
  onSelectPR: (owner: string, repo: string, pullNumber: number) => void;
}) => {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [prs, setPrs] = useState<GithubPR[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPrs, setLoadingPrs] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen || !githubToken) return;
    setSelectedRepo(null);
    setSearch('');

    const fetchRepos = async () => {
      setLoading(true);
      setError('');
      try {
        const octokit = new Octokit({ auth: githubToken });
        const { data } = await octokit.rest.repos.listForAuthenticatedUser({
          sort: 'updated',
          per_page: 50
        });
        setRepos(data as unknown as GithubRepo[]);
      } catch (err: any) {
        setError(err.message || 'Failed to load repositories');
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [isOpen, githubToken]);

  const handleRepoClick = async (repo: GithubRepo) => {
    setSelectedRepo(repo);
    setLoadingPrs(true);
    setPrs([]);
    setError('');
    const [owner, name] = repo.full_name.split('/');
    try {
      const octokit = new Octokit({ auth: githubToken });
      const { data } = await octokit.rest.pulls.list({
        owner,
        repo: name,
        state: 'open',
        sort: 'updated',
        direction: 'desc'
      });
      setPrs(data as unknown as GithubPR[]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch PRs');
    } finally {
      setLoadingPrs(false);
    }
  };

  const filteredRepos = repos.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-background w-full max-w-2xl max-h-[85vh] rounded-[24px] border border-border flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {selectedRepo ? (
              <button
                onClick={() => setSelectedRepo(null)}
                className="p-2 -ml-2 rounded-xl text-muted hover:text-foreground hover:bg-surface transition-all flex items-center gap-1 text-sm font-bold tracking-tight"
              >
                <ChevronLeft size={18} /> Back
              </button>
            ) : (
              <>
                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <GitForkIcon size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground tracking-tight">GitHub Integration</h2>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted mt-0.5">Select a repository to analyze</p>
                </div>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface rounded-xl text-muted hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {!selectedRepo && (
          <div className="p-4 border-b border-border bg-background shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search repositories..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium placeholder:text-muted/50 text-foreground"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-2 relative scrollbar-hide">
          {!githubToken ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4">
              <Key className="w-12 h-12 text-muted/30" />
              <div>
                <p className="text-sm font-bold text-foreground">Token Required</p>
                <p className="text-xs text-muted max-w-xs mx-auto mt-1">Please add your GitHub Personal Access Token in the settings to connect.</p>
              </div>
            </div>
          ) : selectedRepo ? (
            <div className="space-y-4">
              <div className="p-5 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <h3 className="font-bold text-foreground text-lg">{selectedRepo.name}</h3>
                  <p className="text-xs text-muted uppercase tracking-widest font-bold mt-1">Full Codebase Scan</p>
                </div>
                <button
                  onClick={() => onSelectRepo(selectedRepo.full_name.split('/')[0], selectedRepo.name, 'main')}
                  className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 text-sm"
                >
                  Analyze Repo
                </button>
              </div>

              <div className="pt-2">
                <h4 className="px-1 text-[10px] font-black uppercase text-muted tracking-[0.2em] mb-3 flex items-center gap-2">
                  <GitPullRequest size={12} className="text-blue-500" />
                  Open Pull Requests
                </h4>
                {error && (
                  <div className="p-3 mb-3 border border-red-500/20 bg-red-500/5 rounded-xl">
                    <p className="text-xs font-bold text-red-500 text-center">{error}</p>
                  </div>
                )}
                {loadingPrs ? (
                  <div className="py-12 flex items-center justify-center">
                    <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                  </div>
                ) : prs.length === 0 ? (
                  <div className="py-10 text-center border-2 border-dashed border-border rounded-xl">
                    <p className="text-xs font-medium text-muted">No open pull requests found.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {prs.map(pr => (
                      <button
                        key={pr.id}
                        onClick={() => onSelectPR(selectedRepo.full_name.split('/')[0], selectedRepo.name, pr.number)}
                        className="w-full p-4 rounded-xl border border-border bg-surface hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left group flex gap-4"
                      >
                        <div className="text-blue-500 shrink-0 mt-0.5"><GitPullRequest size={18} /></div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-foreground text-sm truncate">{pr.title}</h5>
                          <p className="text-xs text-muted mt-1 uppercase tracking-wider font-medium">
                            #{pr.number} by {pr.user.login} • {new Date(pr.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader className="w-6 h-6 text-emerald-500 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Syncing Repositories</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
              <p className="text-xs font-bold text-red-500">{error}</p>
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="py-20 text-center text-sm font-medium text-muted">
              No repositories found.
            </div>
          ) : (
            filteredRepos.map(repo => (
              <motion.button
                key={repo.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleRepoClick(repo)}
                className="w-full p-4 rounded-2xl border border-border bg-surface hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left group flex items-start gap-4"
              >
                <div className="p-2 bg-background border border-border rounded-lg group-hover:border-emerald-500/20 group-hover:text-emerald-500 transition-colors text-muted shrink-0 mt-0.5">
                  <FolderGit2 size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-foreground truncate text-sm">{repo.name}</span>
                    {repo.private && (
                      <span className="px-1.5 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 flex items-center gap-1 text-[9px] font-black uppercase text-amber-500 tracking-wider">
                        <Lock size={10} /> Private
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted truncate">{repo.description || 'No description provided'}</p>
                  <p className="text-[10px] text-muted/50 font-medium uppercase tracking-wider mt-2">
                    Updated {new Date(repo.updated_at || '').toLocaleDateString()}
                  </p>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('review_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('review_sessions');
    if (saved) return JSON.parse(saved);

    // Check for legacy data
    const legacy = localStorage.getItem('review_history');
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      if (parsedLegacy.length > 0) {
        return [{
          id: 'legacy-session',
          title: 'Legacy Review History',
          messages: parsedLegacy.flatMap((r: { code: string; content: string; timestamp: string }) => [
            { role: 'user', content: 'Review Code', code: r.code, timestamp: r.timestamp },
            { role: 'assistant', content: r.content, timestamp: r.timestamp }
          ]),
          focusModes: ['Security', 'Performance', 'Clean Code', 'Logic'],
          createdAt: Date.now()
        }];
      }
    }
    return [];
  });

  const [activeId, setActiveId] = useState<string | null>(() => {
    const saved = localStorage.getItem('active_session_id');
    return saved || null;
  });

  const [code, setCode] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [focusModes, setFocusModes] = useState(['Security', 'Performance', 'Clean Code', 'Logic']);
  const [isDragging, setIsDragging] = useState(false);
  const [lang, setLang] = useState('English');
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('review_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(GROQ_API_KEY);
  const [githubToken, setGithubToken] = useState(() => {
    return localStorage.getItem('review_github_token') || '';
  });
  const [showGithubModal, setShowGithubModal] = useState(false);

  const activeSession = sessions.find(s => s.id === activeId);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence Hooks
  useEffect(() => {
    localStorage.setItem('review_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('review_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (activeId) localStorage.setItem('active_session_id', activeId);
  }, [activeId]);

  useEffect(() => {
    localStorage.setItem('review_github_token', githubToken);
  }, [githubToken]);

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Review',
      messages: [],
      focusModes: ['Security', 'Performance', 'Clean Code', 'Logic'],
      createdAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveId(newSession.id);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    googleLogout();
    setUser(null);
    setSessions([]);
    setActiveId(null);
    localStorage.removeItem('review_user');
    localStorage.removeItem('review_sessions');
    localStorage.removeItem('active_session_id');
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
    const combinedContent = fileContents.join('\n\n');

    setCode((prev) => prev + (prev ? '\n\n' : '') + combinedContent);
    e.target.value = '';
  };

  const fetchGithubContent = async (url: string) => {
    try {
      let rawUrl = url;
      if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
        rawUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      }
      const res = await axios.get(rawUrl);
      return typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
    } catch (err) {
      console.error('Github Fetch Error:', err);
      throw new Error('Failed to fetch from GitHub. Ensure the URL is public.');
    }
  };

  const handleRepoSelect = async (owner: string, repo: string, defaultBranch: string) => {
    setShowGithubModal(false);
    setIsReviewing(true);
    setError('');

    try {
      const octokit = new Octokit({ auth: githubToken });

      const { data: branchData } = await octokit.rest.repos.getBranch({
        owner,
        repo,
        branch: defaultBranch
      });
      const treeSha = branchData.commit.commit.tree.sha;

      const { data: treeData } = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: treeSha,
        recursive: 'true'
      });

      const validExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.css', '.html', '.json', '.md', '.java', '.cpp', '.c', '.go', '.rs', '.rb', '.php', '.sh', '.yml', '.yaml'];
      const fileNodes = treeData.tree
        .filter((item) => item.type === 'blob')
        .filter((item) => item.path && validExtensions.some(ext => item.path!.endsWith(ext)));

      if (fileNodes.length === 0) {
        throw new Error('No supported source code files found in repository.');
      }

      const decodeBase64UTF8 = (base64Str: string) => {
        const binString = atob(base64Str.replace(/\n/g, ''));
        const bytes = new Uint8Array(binString.length);
        for (let i = 0; i < binString.length; i++) {
          bytes[i] = binString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
      };

      const fetchFileContent = async (fileSha: string, path: string) => {
        try {
          const { data } = await octokit.rest.git.getBlob({
            owner,
            repo,
            file_sha: fileSha
          });
          if (data.encoding === 'base64') {
            return `// --- File: ${path} ---\n${decodeBase64UTF8(data.content)}`;
          }
          return `// --- File: ${path} ---\n// (Content not decodable)`;
        } catch (e) {
          return `// --- File: ${path} ---\n// (Failed to fetch)`;
        }
      };

      let combinedStr = `// --- Repository: ${owner}/${repo} ---\n\n`;
      combinedStr += `// --- Directory Structure ---\n`;
      treeData.tree.forEach((item: any) => {
        combinedStr += `// ${item.type === 'tree' ? '📁' : '📄'} ${item.path}\n`;
      });
      combinedStr += `\n`;

      // Process in batches of 5
      for (let i = 0; i < fileNodes.length; i += 5) {
        const batch = fileNodes.slice(i, i + 5);
        const contents = await Promise.all(batch.map(node => fetchFileContent(node.sha as string, node.path as string)));
        combinedStr += contents.join('\n\n') + '\n\n';
      }

      setCode(combinedStr);
      setIsReviewing(false);

    } catch (err: any) {
      setError(err.message || 'Failed to fetch repository files.');
      setIsReviewing(false);
    }
  };

  const handlePRSelect = async (owner: string, repo: string, pullNumber: number) => {
    setShowGithubModal(false);
    setIsReviewing(true);
    setError('');

    let targetId = activeId;
    if (!targetId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: `PR Review: ${owner}/${repo} #${pullNumber}`,
        messages: [],
        focusModes: ['Security', 'Performance', 'Clean Code', 'Logic'],
        createdAt: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveId(newSession.id);
      targetId = newSession.id;
    }

    try {
      const octokit = new Octokit({ auth: githubToken });

      const { data: files } = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber,
        per_page: 100
      });

      if (files.length === 0) {
        throw new Error('No files changed in this pull request.');
      }

      let combinedStr = `// --- PR Review: ${owner}/${repo} #${pullNumber} ---\n\n`;
      files.forEach(file => {
        combinedStr += `// --- File: ${file.filename} ---\n`;
        combinedStr += `// Status: ${file.status}, Additions: ${file.additions}, Deletions: ${file.deletions}\n`;
        if (file.patch) {
          combinedStr += `/* DIFF PATCH:\n${file.patch}\n*/\n\n`;
        } else {
          combinedStr += `// (No diff patch available or binary file)\n\n`;
        }
      });

      const userMessage: Message = {
        role: 'user',
        content: `Automated Request: Analyze Pull Request #${pullNumber} on ${owner}/${repo} and post review to GitHub.`,
        code: combinedStr,
        timestamp: new Date().toLocaleTimeString()
      };

      setSessions(prev => prev.map(s =>
        s.id === targetId ? { ...s, messages: [...s.messages, userMessage] } : s
      ));

      const prompt = `You are an elite AI Code Reviewer. Review the following GitHub Pull Request diff patches.
You must output a strictly valid JSON object containing exactly one key: "reviews". The value of "reviews" must be an array of objects.
Each object represents a specific issue on a specific line of code and must have exactly these keys:
- "path": The exact file path (e.g. "src/App.tsx")
- "line": The exact line number in the patched file where the comment applies (guess the exact right-side post-patch line number based on the @@ diff headers).
- "body": The markdown comment describing the issue or suggestion.

Only comment on actual issues (security, bugs, bad practices). If everything looks perfect, return { "reviews": [] }.

PULL REQUEST DIFF:
${combinedStr}`;

      const baseUrl = 'https://api.groq.com/openai/v1';
      const response = await axios.post(
        `${baseUrl}/chat/completions`,
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are an AI code reviewer. Always output raw JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      let content = response.data.choices[0].message.content;
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else parsed = { reviews: [] };
      }

      const reviews = parsed.reviews || [];
      let finalAiMessage = "";

      if (reviews.length > 0) {
        const reviewBody = reviews.map((r: any) => `### File: \`${r.path}\` (Line ~${r.line})\n${r.body}`).join('\n\n---\n\n');
        finalAiMessage = `✅ **Successfully generated PR review. Attempting to post to GitHub #${pullNumber}...**\n\n${reviewBody}`;

        try {
          await octokit.rest.pulls.createReview({
            owner,
            repo,
            pull_number: pullNumber,
            event: 'COMMENT',
            body: `### CodeReview.AI Automated Analysis 🤖\n\n${reviewBody}`
          });
          finalAiMessage = `✅ **Successfully posted review to GitHub PR #${pullNumber} !**\n\n${reviewBody}`;
        } catch (githubErr: any) {
          finalAiMessage = `⚠️ **Analyzed PR #${pullNumber}, but failed to post to GitHub api:** ${githubErr.message}\n\n${reviewBody}`;
        }
      } else {
        finalAiMessage = `✅ **PR #${pullNumber} is pristine.** No issues found! Attempting to post approval to GitHub...`;
        try {
          await octokit.rest.pulls.createReview({
            owner,
            repo,
            pull_number: pullNumber,
            event: 'COMMENT',
            body: `### CodeReview.AI Automated Analysis 🤖\n\nLGTM! No security, performance, or logic issues found in this diff.`
          });
          finalAiMessage = `✅ **Posted PR Approval to GitHub # ${pullNumber}.** No issues found!`;
        } catch (e: any) {
          finalAiMessage = `✅ **PR #${pullNumber} is pristine.** No issues found! (Failed to post to GitHub: ${e.message})`;
        }
      }

      const aiMessage: Message = {
        role: 'assistant',
        content: finalAiMessage,
        timestamp: new Date().toLocaleTimeString()
      };

      setSessions(prev => prev.map(s => {
        if (s.id === targetId) {
          return { ...s, messages: [...s.messages, aiMessage] };
        }
        return s;
      }));

      setIsReviewing(false);

    } catch (err: any) {
      setError(err.message || 'Failed to analyze Pull Request.');
      setIsReviewing(false);
    }
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, isReviewing]);

  const handleReview = useCallback(async () => {
    if (!code.trim()) return;

    let targetId = activeId;
    if (!targetId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: code.trim().slice(0, 30) + (code.trim().length > 30 ? '...' : ''),
        messages: [],
        focusModes: ['Security', 'Performance', 'Clean Code', 'Logic'],
        createdAt: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveId(newSession.id);
      targetId = newSession.id;
    }

    let currentCode = code;
    setIsReviewing(true);
    setError('');

    if (currentCode.trim().startsWith('https://github.com')) {
      try {
        currentCode = await fetchGithubContent(currentCode.trim());
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        setIsReviewing(false);
        return;
      }
    }

    const userMessage: Message = {
      role: 'user',
      content: 'Review this code',
      code: currentCode,
      timestamp: new Date().toLocaleTimeString()
    };

    // Optimistically add user message
    setSessions(prev => prev.map(s =>
      s.id === targetId ? { ...s, messages: [...s.messages, userMessage] } : s
    ));
    setCode('');

    const baseUrl = 'https://api.groq.com/openai/v1';
    const model = 'llama-3.3-70b-versatile';

    try {
      const response = await axios.post(
        `${baseUrl}/chat/completions`,
        {
          model: model,
          messages: [
            {
              role: 'system',
              content: `You are an elite production-grade code reviewer. 
              Analyze the provided code specifically for: ${focusModes.join(', ')}.
              
              IMPORTANT: You MUST communicate entirely in ${lang}. 
              Detect the programming language and provide a "Production Grade" score (0-100).
              
              ABSOLUTELY CRITICAL RULE: For EVERY single suggestion, critique, or change you propose, you MUST professionally cite your exact source. 
              Format your reasoning and source professionally for each point like this:
              
              > 📚 **Source:** [Source Name] - [Full URL]
              > 🧠 **Reasoning:** [Explain reasoning]
              
              FORMATTING: Use Markdown. Use 'diff' for code improvements.`
            },
            {
              role: 'user',
              content: `Review this code:\n\n\`\`\`\n${currentCode}\n\`\`\``
            }
          ],
          temperature: 0.2
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiMessage: Message = {
        role: 'assistant',
        content: response.data.choices[0].message.content,
        timestamp: new Date().toLocaleTimeString()
      };

      setSessions(prev => prev.map(s => {
        if (s.id === targetId) {
          const isFirstMessage = s.messages.length <= 1;
          const newTitle = isFirstMessage
            ? currentCode.slice(0, 30).replace(/\n/g, ' ') + '...'
            : s.title;
          return { ...s, title: newTitle, messages: [...s.messages, aiMessage] };
        }
        return s;
      }));
    } catch (err: unknown) {
      console.error('API Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Groq API.';
      setError(errorMessage);
    } finally {
      setIsReviewing(false);
    }
  }, [code, lang, apiKey, focusModes, activeId]);

  // Handle auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [code]);

  // Detect System Language
  useEffect(() => {
    const userLang = navigator.language || 'en-US';
    try {
      const displayNames = new Intl.DisplayNames([userLang], { type: 'language' });
      const langName = displayNames.of(userLang.split('-')[0]) || 'English';
      setLang(langName);
    } catch {
      setLang('English');
    }
  }, []);

  // Theme management
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('review_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('review_theme', 'light');
    }
  }, [isDark]);

  // Syntax highlighting trigger
  useEffect(() => {
    Prism.highlightAll();
  }, [sessions]);

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

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 0 }}
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
            {sessions.length === 0 ? (
              <div className="px-3 py-6 text-center border border-dashed border-border rounded-xl bg-background/50">
                <p className="text-[10px] text-muted uppercase tracking-widest font-black leading-relaxed">System Idle</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sessions.map((s) => (
                  <motion.div
                    key={s.id}
                    layout
                    whileHover={{ x: 2 }}
                    onClick={() => setActiveId(s.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group transition-all duration-200 border ${activeId === s.id
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-muted hover:bg-surface-hover hover:text-foreground'
                      }`}
                  >
                    <MessageSquare size={14} className={activeId === s.id ? 'text-emerald-500' : 'text-muted/60 group-hover:text-emerald-500/50'} />
                    <span className="text-xs truncate flex-1 font-bold tracking-tight">{s.title}</span>
                    <button
                      onClick={(e) => deleteSession(e, s.id)}
                      className={`p-1 rounded-md transition-all ${activeId === s.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} hover:text-red-500 hover:bg-red-500/10`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
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

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden fixed left-0 top-0 h-screen w-[300px] bg-surface border-r  z-50 flex flex-col overflow-hidden shadow-2xl">
              <div className="flex items-center gap-4 p-6 border-b ">
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
                  onClick={createNewChat}
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
                  {sessions.length === 0 ? (
                    <div className="px-4 py-12 text-center border-2 border-dashed  rounded-2xl">
                      <p className="text-xs text-muted italic font-medium">No reviews found.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => { setActiveId(s.id); setSidebarOpen(false); }}
                          className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer group transition-all duration-200 border ${activeId === s.id
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 p-6 border-t  bg-surface/50">
                {user && (
                  <div className="p-3.5 rounded-2xl bg-background border  flex items-center gap-4 shadow-sm">
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

                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background border  text-xs text-muted">
                  <Globe size={16} className="text-emerald-500 shrink-0" />
                  <span className="truncate font-bold tracking-wide uppercase">{lang} MODE</span>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

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

        {/* Chat Flow */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-10">
          <div className="w-full max-w-3xl mx-auto px-6 space-y-12">
            {(!activeId || (activeSession && activeSession.messages.length === 0)) && !isReviewing && (
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
              {activeSession?.messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col gap-4 ${msg.role === 'assistant' ? 'bg-surface/30 -mx-6 px-6 py-10 border-y border-border/50' : 'py-2'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-black ${msg.role === 'user' ? 'bg-zinc-900' : 'bg-emerald-500'}`}>
                        {msg.role === 'user' ? 'U' : 'A'}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${msg.role === 'user' ? 'text-muted' : 'text-emerald-500'}`}>
                        {msg.role === 'user' ? 'Source Input' : 'Agent Response'}
                      </span>
                    </div>
                    {msg.role === 'user' && msg.code && <CopyButton text={msg.code} className="scale-75" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    {msg.role === 'user' ? (
                      <div className="space-y-4">
                        {msg.code ? (
                          <div className="rounded-xl border border-border bg-zinc-950 overflow-hidden shadow-sm">
                            <pre className="p-5 font-mono text-[12px] text-zinc-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                              <code>{msg.code}</code>
                            </pre>
                          </div>
                        ) : (
                          <p className="text-foreground text-lg font-medium leading-relaxed">{msg.content}</p>
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
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-border/40 opacity-40 group-hover:opacity-100 transition-opacity">
                          <span className="text-[9px] font-black uppercase tracking-widest">{msg.timestamp}</span>
                          <div className="flex items-center gap-3">
                            <button onClick={() => downloadReport(msg.content)} className="hover:text-emerald-500 transition-colors"><Download size={14} /></button>
                            <CopyButton text={msg.content} className="border-none bg-transparent shadow-none p-0 hover:text-emerald-500" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

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

        {/* Floating Command Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 pointer-events-none z-30">
          <div className="pointer-events-auto bg-surface/80 backdrop-blur-2xl border border-border shadow-2xl rounded-[28px] p-2 flex flex-col gap-2 relative">

            {/* Subtle Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-full backdrop-blur-md shadow-sm"
                >
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Context Chips (Optional) */}
            <div className="flex items-center gap-1.5 px-2 py-1 overflow-x-auto scrollbar-hide">
              {['Security', 'Performance', 'Architecture'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setFocusModes(prev => prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode])}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${focusModes.includes(mode) ? 'bg-emerald-500 text-white shadow-lg' : 'bg-surface hover:bg-surface-hover text-muted hover:text-foreground border border-border'}`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div
              className={`flex items-end gap-2 p-2 rounded-[22px] transition-all duration-300 ${isDragging ? 'bg-emerald-500/5 ring-4 ring-emerald-500/10' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                multiple
                accept=".js,.jsx,.ts,.tsx,.py,.css,.html,.json,.md,.txt,.java,.cpp,.c,.go,.rs,.rb,.php"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all flex items-center justify-center shrink-0 border border-transparent hover:border-border"
              >
                <Paperclip size={18} strokeWidth={2} />
              </button>

              <button
                onClick={() => setShowGithubModal(true)}
                className="w-10 h-10 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground transition-all flex items-center justify-center shrink-0 border border-transparent hover:border-border"
                title="Browse GitHub Repositories"
              >
                <GitForkIcon size={18} strokeWidth={2} />
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReview(); } }}
                placeholder={isDragging ? "Drop files to analyze..." : "Message CodeReview.AI..."}
                className="flex-1 bg-transparent border-none text-foreground font-sans text-[15px] outline-none min-h-[40px] max-h-60 resize-none scrollbar-hide py-2 px-2 placeholder:text-muted/50 font-medium"
              />

              <motion.button
                disabled={!code.trim() || isReviewing}
                onClick={handleReview}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 text-white flex items-center justify-center shrink-0 shadow-lg disabled:opacity-20 disabled:grayscale transition-all"
              >
                {isReviewing ? <Loader size={18} className="animate-spin" /> : <Send size={18} strokeWidth={2.5} />}
              </motion.button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-6 opacity-30 pointer-events-none">
            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em]"><Shield size={10} /> Encrypted</div>
            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em]"><Cpu size={10} /> Llama 3.3 Core</div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-50 flex items-center justify-center p-6 theme-transition"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-background w-full max-w-md rounded-[24px] border border-border p-8 shadow-premium relative inner-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-foreground tracking-tighter uppercase font-display">System Settings</h3>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-50">Configuration Protocol</p>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-all border border-transparent hover:border-border"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-5">
                <div className="space-y-3 group">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] px-1 opacity-60">Authentication Protocol</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-emerald-500 transition-colors">
                      <Key size={16} strokeWidth={2.5} />
                    </div>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-foreground font-mono text-xs outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-muted/20 shadow-xs"
                      placeholder="Secure API Gateway Key..."
                    />
                  </div>
                </div>

                <div className="space-y-3 group">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] px-1 opacity-60">GitHub Connection</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-emerald-500 transition-colors">
                      <GitForkIcon size={16} strokeWidth={2.5} />
                    </div>
                    <input
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-foreground font-mono text-xs outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-muted/20 shadow-xs"
                      placeholder="Personal Access Token (PAT)..."
                    />
                  </div>
                </div>

                <div className="p-4 bg-surface border border-border rounded-2xl hover:border-emerald-500/20 transition-all shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/5 rounded-lg border border-blue-500/10 text-blue-500">
                      <Globe size={16} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-black text-foreground uppercase tracking-wider">Interface Language</p>
                      <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-50">{lang} Mode Active</p>
                    </div>
                    <div className="px-2 py-1 bg-surface-hover rounded-md border border-border text-[9px] font-black uppercase text-muted">Ready</div>
                  </div>
                </div>

                <div className="p-4 bg-surface border border-border rounded-2xl hover:border-emerald-500/20 transition-all shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/5 rounded-lg border border-purple-500/10 text-purple-500">
                      <Zap size={16} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-black text-foreground uppercase tracking-wider">Analysis Core</p>
                      <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-50">Llama-3.3-70b-versatile</p>
                    </div>
                    <div className="px-2 py-1 bg-emerald-500/10 rounded-md border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-500">Fast</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="w-full mt-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 uppercase tracking-[0.2em] text-[10px]"
              >
                Sync Configuration
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
