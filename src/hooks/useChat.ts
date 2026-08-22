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

  // Synchronous ref to track loaded/new session IDs
  const loadedIdsRef = useRef<Set<string>>(new Set());

  // Keep a ref to sessions to avoid stale state in async callbacks
  const sessionsRef = useRef(sessions);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  // Fetch messages when activeId changes (Lazy Loading for cloud sessions)
  useEffect(() => {
    if (!user || !activeId) return;

    // Check if we already have this loaded locally (synchronous ref)
    if (loadedIdsRef.current.has(activeId)) return;

    const existingSession = sessionsRef.current.find(s => s.id === activeId);

    // If session already has messages in memory, mark as loaded without refetching
    if (existingSession && existingSession.messages && existingSession.messages.length > 0) {
      loadedIdsRef.current.add(activeId);
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
          loadedIdsRef.current.add(activeId);
        })
        .catch((err) => {
          console.error("Failed to load session messages:", err);
          loadedIdsRef.current.add(activeId);
        })
        .finally(() => setIsLoadingMessages(false));
    }
  }, [activeId, user?.email, setSessions]);

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
    loadedIdsRef.current.add(newId);
    setSessions(prev => user ? [newSession, ...prev] : [newSession]);
    navigate(`/chat/${newId}`);
  }, [user, navigate, setSessions]);

  const deleteSession = useCallback(async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    loadedIdsRef.current.delete(id);
    setSessions(prev => prev.filter(s => s.id !== id));

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
    const currentCode = code.trim();
    if (!currentCode || isReviewing) return;

    setIsReviewing(true);
    setError('');

    let processedCode = currentCode;
    if (processedCode.startsWith('https://github.com')) {
      try {
        processedCode = await fetchGithubContent(processedCode);
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
      code: processedCode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now()
    };

    let targetId = activeId;
    const isNewSession = !targetId;
    let createdSession: ChatSession | null = null;

    if (isNewSession) {
      const newId = crypto.randomUUID();
      targetId = newId;

      // Extract a clean title from the code
      const firstLine = processedCode.split('\n')[0].replace(/[//*#-]/g, '').trim();
      const sessionTitle = (firstLine.length > 3 ? firstLine.slice(0, 32) : 'Code Analysis') + (firstLine.length > 32 ? '...' : '');

      createdSession = {
        id: newId,
        title: sessionTitle,
        messages: [userMessage],
        focusModes: focusModes.length > 0 ? focusModes : DEFAULT_FOCUS_MODES,
        createdAt: Date.now()
      };

      // Mark ID as loaded immediately to prevent cloud race condition
      loadedIdsRef.current.add(newId);
      setSessions(prev => user ? [createdSession!, ...prev] : [createdSession!]);
      navigate(`/chat/${newId}`);
    } else {
      setSessions(prev => prev.map(s =>
        s.id === targetId ? { ...s, messages: [...s.messages, userMessage] } : s
      ));
    }

    setCode('');

    try {
      const result = await analyzeCode(processedCode, apiKey, focusModes, lang);
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now()
      };

      setSessions(prev => {
        return prev.map(s => {
          if (s.id === targetId) {
            const updated = { ...s, messages: [...s.messages, aiMessage] };
            if (user?.email) {
              FirebaseService.saveSession(user.email, updated).catch(console.warn);
            }
            return updated;
          }
          return s;
        });
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to AI Review Service.';
      setError(msg);
    } finally {
      setIsReviewing(false);
    }
  }, [code, isReviewing, activeId, focusModes, user, navigate, setSessions, apiKey, lang]);

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

      const codeSnippets: string[] = [];
      files.forEach((file: any) => {
        if (file.patch) {
          codeSnippets.push(`--- File: ${file.filename} ---\n${file.patch}`);
        }
      });

      const fullPatch = codeSnippets.join('\n\n');
      if (!fullPatch) throw new Error('No readable diffs or patches found in PR.');

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: `Audit Pull Request #${pullNumber} (${owner}/${repo})`,
        code: fullPatch.length > 2000 ? `${fullPatch.substring(0, 2000)}\n\n// ... (truncated)` : fullPatch,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now()
      };

      if (!targetId) {
        const newId = crypto.randomUUID();
        targetId = newId;
        const newSession: ChatSession = {
          id: newId,
          title: `PR #${pullNumber}: ${owner}/${repo}`,
          messages: [userMessage],
          focusModes: focusModes.length > 0 ? focusModes : DEFAULT_FOCUS_MODES,
          createdAt: Date.now()
        };

        loadedIdsRef.current.add(newId);
        setSessions(prev => user ? [newSession, ...prev] : [newSession]);
        navigate(`/chat/${newId}`);
      } else {
        setSessions(prev => prev.map(s =>
          s.id === targetId ? { ...s, messages: [...s.messages, userMessage] } : s
        ));
      }

      const reviewData = await analyzePR(fullPatch, apiKey);
      const reviewList: GithubReview[] = reviewData.reviews || [];
      const summaryText = reviewList.length > 0
        ? `### Pull Request Audit: #${pullNumber}\nFound **${reviewList.length}** issues / recommendations across changed files:\n\n` +
          reviewList.map((r, i) => `#### ${i + 1}. \`${r.path}\` (Line ${r.line})\n${r.body}`).join('\n\n')
        : `### Pull Request Audit: #${pullNumber}\n✅ **No critical issues found.** The changes in this pull request adhere to standard practices.`;

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: summaryText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now()
      };

      setSessions(prev => prev.map(s => {
        if (s.id === targetId) {
          const updated = { ...s, messages: [...s.messages, aiMessage] };
          if (user?.email) {
            FirebaseService.saveSession(user.email, updated).catch(console.warn);
          }
          return updated;
        }
        return s;
      }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to analyze PR.');
    } finally {
      setIsReviewing(false);
    }
  };

  return {
    code, setCode,
    isReviewing,
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
