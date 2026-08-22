import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ChatSession, Message, GithubReview, User } from '../types';
import { analyzeCode, analyzePR } from '../services/groqService';
import { fetchGithubContent, getOctokit, decodeBase64UTF8 } from '../services/githubService';
import { FirebaseService } from '../services/firebaseService';
import { VALID_EXTENSIONS, DEFAULT_FOCUS_MODES, GROQ_API_KEY } from '../config';

export const useChat = (
  user: User | null,
  sessions: ChatSession[],
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>,
  githubToken: string,
  apiKey: string = GROQ_API_KEY
) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeId = pathname.startsWith('/chat/') ? pathname.split('/')[2] : undefined;

  const [code, setCode] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [focusModes, setFocusModes] = useState<string[]>(DEFAULT_FOCUS_MODES);
  const [error, setError] = useState('');
  const [lang, setLang] = useState('English');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());

  // Keep a ref to sessions to avoid stale state in async callbacks
  const sessionsRef = useRef(sessions);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  // Fetch messages when activeId changes (Lazy Loading for cloud sessions)
  useEffect(() => {
    if (!user || !activeId) return;

    // Check if we already have this loaded locally
    if (loadedIds.has(activeId)) return;

    const existingSession = sessionsRef.current.find(s => s.id === activeId);

    // If session already has messages in memory, mark as loaded without refetching
    if (existingSession && existingSession.messages && existingSession.messages.length > 0) {
      setLoadedIds(prev => new Set(prev).add(activeId));
      return;
    }

    // Only load from cloud if existing session has 0 messages and hasn't been fetched
    if (existingSession && existingSession.messages.length === 0) {
      setIsLoadingMessages(true);
      FirebaseService.getSessionMessages(user.email, activeId)
        .then(messages => {
          if (messages && messages.length > 0) {
            setSessions(prev => prev.map(s =>
              s.id === activeId ? { ...s, messages } : s
            ));
          }
          setLoadedIds(prev => new Set(prev).add(activeId));
        })
        .catch((err) => {
          console.error("Failed to load session messages:", err);
          setLoadedIds(prev => new Set(prev).add(activeId));
        })
        .finally(() => setIsLoadingMessages(false));
    }
  }, [activeId, user?.email, loadedIds, setSessions]);

  // Detect user interface language
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

  const createNewChat = useCallback(() => {
    const newId = crypto.randomUUID();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Review',
      messages: [],
      focusModes: DEFAULT_FOCUS_MODES,
      createdAt: Date.now()
    };

    // Immediately mark as loaded so lazy fetch won't overwrite with empty
    setLoadedIds(prev => new Set(prev).add(newId));
    setSessions(prev => [newSession, ...prev]);
    navigate(`/chat/${newId}`);
  }, [navigate, setSessions]);

  const deleteSession = useCallback(async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    setSessions(prev => prev.filter(s => s.id !== id));
    setLoadedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    if (user?.email) {
      try {
        await FirebaseService.deleteSession(user.email, id);
      } catch (err) {
        console.error("Failed to delete session from Firebase:", err);
      }
    }

    if (activeId === id) {
      navigate('/', { replace: true });
    }
  }, [user, activeId, navigate, setSessions]);

  const handleReview = useCallback(async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    setIsReviewing(true);
    setError('');

    let currentCode = trimmedCode;
    if (currentCode.startsWith('https://github.com')) {
      try {
        currentCode = await fetchGithubContent(currentCode);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch GitHub repository URL');
        setIsReviewing(false);
        return;
      }
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: 'Analyze and review this code',
      code: currentCode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now()
    };

    let targetId = activeId;
    const isNewSession = !targetId;

    if (isNewSession) {
      const newId = crypto.randomUUID();
      targetId = newId;

      // Extract a clean title from the code
      const firstLine = currentCode.split('\n')[0].replace(/[//*#-]/g, '').trim();
      const sessionTitle = (firstLine.length > 3 ? firstLine.slice(0, 32) : 'Code Analysis') + (firstLine.length > 32 ? '...' : '');

      const newSession: ChatSession = {
        id: newId,
        title: sessionTitle,
        messages: [userMessage],
        focusModes: focusModes.length > 0 ? focusModes : DEFAULT_FOCUS_MODES,
        createdAt: Date.now()
      };

      // Mark ID as loaded immediately to prevent cloud race condition
      setLoadedIds(prev => new Set(prev).add(newId));
      setSessions(prev => [newSession, ...prev]);
      navigate(`/chat/${newId}`);
    } else {
      setSessions(prev => prev.map(s =>
        s.id === targetId ? { ...s, messages: [...s.messages, userMessage] } : s
      ));
    }

    setCode('');

    try {
      const result = await analyzeCode(currentCode, apiKey, focusModes, lang);
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now()
      };

      setSessions(prev => prev.map(s => {
        if (s.id === targetId) {
          return { ...s, messages: [...s.messages, aiMessage] };
        }
        return s;
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to AI Review Service.';
      setError(msg);
    } finally {
      setIsReviewing(false);
    }
  }, [code, lang, apiKey, focusModes, activeId, setSessions, navigate]);

  const handleRepoSelect = async (owner: string, repo: string, defaultBranch: string) => {
    setIsReviewing(true);
    setError('');

    try {
      const octokit = getOctokit(githubToken);
      const { data: branchData } = await octokit.rest.repos.getBranch({ owner, repo, branch: defaultBranch });
      const { data: treeData } = await octokit.rest.git.getTree({ owner, repo, tree_sha: branchData.commit.commit.tree.sha, recursive: 'true' });

      const fileNodes = treeData.tree.filter(item => item.type === 'blob' && item.path && VALID_EXTENSIONS.some(ext => item.path!.endsWith(ext)));
      if (fileNodes.length === 0) throw new Error('No supported source code files found.');

      const fetchFileContent = async (fileSha: string, path: string) => {
        try {
          const { data } = await octokit.rest.git.getBlob({ owner, repo, file_sha: fileSha });
          return data.encoding === 'base64' ? `// --- File: ${path} ---\n${decodeBase64UTF8(data.content)}` : `// --- File: ${path} ---\n// (Content not decodable)`;
        } catch { return `// --- File: ${path} ---\n// (Failed to fetch)`; }
      };

      let combinedStr = `// --- Repository: ${owner}/${repo} ---\n\n// --- Directory Structure ---\n`;
      treeData.tree.forEach(item => combinedStr += `// ${item.type === 'tree' ? '📁' : '📄'} ${item.path}\n`);
      combinedStr += '\n';

      for (let i = 0; i < fileNodes.length; i += 5) {
        const batch = fileNodes.slice(i, i + 5);
        const contents = await Promise.all(batch.map(node => fetchFileContent(node.sha as string, node.path as string)));
        combinedStr += contents.join('\n\n') + '\n\n';
      }

      setCode(combinedStr);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repository files.');
    } finally {
      setIsReviewing(false);
    }
  };

  const handlePRSelect = async (owner: string, repo: string, pullNumber: number) => {
    setIsReviewing(true);
    setError('');

    let targetId = activeId;

    try {
      const octokit = getOctokit(githubToken);
      const { data: files } = await octokit.rest.pulls.listFiles({ owner, repo, pull_number: pullNumber, per_page: 100 });
      if (files.length === 0) throw new Error('No files changed in this PR.');

      let combinedStr = `// --- PR Review: ${owner}/${repo} #${pullNumber} ---\n\n`;
      files.forEach(file => {
        combinedStr += `// --- File: ${file.filename} ---\n// Status: ${file.status}, Additions: ${file.additions}, Deletions: ${file.deletions}\n`;
        combinedStr += file.patch ? `/* DIFF PATCH:\n${file.patch}\n*/\n\n` : `// (No diff patch available)\n\n`;
      });

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: `Analyze GitHub PR #${pullNumber} (${owner}/${repo})`,
        code: combinedStr,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now()
      };

      if (!targetId) {
        const newId = crypto.randomUUID();
        const newSession: ChatSession = {
          id: newId,
          title: `PR #${pullNumber}: ${repo}`,
          messages: [userMessage],
          focusModes: DEFAULT_FOCUS_MODES,
          createdAt: Date.now()
        };

        setLoadedIds(prev => new Set(prev).add(newId));
        setSessions(prev => [newSession, ...prev]);
        navigate(`/chat/${newId}`);
        targetId = newId;
      } else {
        setSessions(prev => prev.map(s => s.id === targetId ? { ...s, messages: [...s.messages, userMessage] } : s));
      }

      const parsed = await analyzePR(combinedStr, apiKey);
      const reviews = (parsed.reviews || []) as GithubReview[];
      let finalAiMessage = reviews.length > 0
        ? `### 🔍 Pull Request Analysis Summary\n\n` + reviews.map((r: GithubReview) => `#### File: \`${r.path}\` (Line ~${r.line})\n${r.body}`).join('\n\n---\n\n')
        : `✅ **PR #${pullNumber} looks solid!** No high-severity issues or vulnerabilities detected.`;

      try {
        await octokit.rest.pulls.createReview({ owner, repo, pull_number: pullNumber, event: 'COMMENT', body: `### CodeReview.AI Automated Analysis 🤖\n\n${reviews.length > 0 ? finalAiMessage : 'LGTM! All checks passed.'}` });
        finalAiMessage += `\n\n> 🚀 **Status:** Successfully posted automated comments directly to GitHub PR #${pullNumber}.`;
      } catch (githubErr: unknown) {
        finalAiMessage += `\n\n> ⚠️ **GitHub API Note:** Unable to post directly to PR: ${githubErr instanceof Error ? githubErr.message : 'Check GitHub PAT permissions.'}`;
      }

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: finalAiMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now()
      };

      setSessions(prev => prev.map(s => s.id === targetId ? { ...s, messages: [...s.messages, aiMessage] } : s));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to analyze GitHub PR.');
    } finally {
      setIsReviewing(false);
    }
  };

  return {
    code, setCode,
    isReviewing, setIsReviewing,
    isLoadingMessages,
    focusModes, setFocusModes,
    error, setError,
    lang,
    activeId,
    createNewChat,
    deleteSession,
    handleReview,
    handleRepoSelect,
    handlePRSelect
  };
};
