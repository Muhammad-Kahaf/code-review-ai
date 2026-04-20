import { useState, useCallback, useEffect } from 'react';
import type { ChatSession, Message, GithubReview } from '../types';
import { analyzeCode, analyzePR } from '../services/groqService';
import { fetchGithubContent, getOctokit, decodeBase64UTF8 } from '../services/githubService';
import { VALID_EXTENSIONS, DEFAULT_FOCUS_MODES } from '../config';

export const useChat = (
  sessions: ChatSession[],
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>,
  activeId: string | null,
  setActiveId: (id: string | null) => void,
  apiKey: string,
  githubToken: string
) => {
  const [code, setCode] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [focusModes, setFocusModes] = useState(DEFAULT_FOCUS_MODES);
  const [error, setError] = useState('');
  const [lang, setLang] = useState('English');

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

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Review',
      messages: [],
      focusModes: DEFAULT_FOCUS_MODES,
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

  const handleReview = useCallback(async () => {
    if (!code.trim()) return;

    let targetId = activeId;
    let currentCode = code;
    setIsReviewing(true);
    setError('');

    if (currentCode.trim().startsWith('https://github.com')) {
      try {
        currentCode = await fetchGithubContent(currentCode.trim());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
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

    if (!targetId) {
      const newSession: ChatSession = {
        id: crypto.randomUUID(),
        title: currentCode.trim().slice(0, 30) + (currentCode.trim().length > 30 ? '...' : ''),
        messages: [userMessage],
        focusModes: DEFAULT_FOCUS_MODES,
        createdAt: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveId(newSession.id);
      targetId = newSession.id;
    } else {
      setSessions(prev => prev.map(s =>
        s.id === targetId ? { ...s, messages: [...s.messages, userMessage] } : s
      ));
    }

    setCode('');

    try {
      const result = await analyzeCode(currentCode, apiKey, focusModes, lang);
      const aiMessage: Message = {
        role: 'assistant',
        content: result,
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
      setError(err instanceof Error ? err.message : 'Failed to connect to Groq API.');
    } finally {
      setIsReviewing(false);
    }
  }, [code, lang, apiKey, focusModes, activeId, sessions, setSessions, setActiveId]);

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
      setIsReviewing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repository files.');
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
      if (files.length === 0) throw new Error('No files changed.');

      let combinedStr = `// --- PR Review: ${owner}/${repo} #${pullNumber} ---\n\n`;
      files.forEach(file => {
        combinedStr += `// --- File: ${file.filename} ---\n// Status: ${file.status}, Additions: ${file.additions}, Deletions: ${file.deletions}\n`;
        combinedStr += file.patch ? `/* DIFF PATCH:\n${file.patch}\n*/\n\n` : `// (No diff patch available)\n\n`;
      });

      const userMessage: Message = { role: 'user', content: `Analyze PR #${pullNumber}`, code: combinedStr, timestamp: new Date().toLocaleTimeString() };

      if (!targetId) {
        const newSession: ChatSession = {
          id: crypto.randomUUID(),
          title: `PR Review: ${owner}/${repo} #${pullNumber}`,
          messages: [userMessage],
          focusModes: DEFAULT_FOCUS_MODES,
          createdAt: Date.now()
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveId(newSession.id);
        targetId = newSession.id;
      } else {
        setSessions(prev => prev.map(s => s.id === targetId ? { ...s, messages: [...s.messages, userMessage] } : s));
      }

      const parsed = await analyzePR(combinedStr, apiKey);
      const reviews = (parsed.reviews || []) as GithubReview[];
      let finalAiMessage = reviews.length > 0
        ? `✅ **Successfully generated PR review. Attempting to post...**\n\n` + reviews.map((r: GithubReview) => `### File: \`${r.path}\` (Line ~${r.line})\n${r.body}`).join('\n\n---\n\n')
        : `✅ **PR #${pullNumber} is pristine.** No issues found!`;

      try {
        await octokit.rest.pulls.createReview({ owner, repo, pull_number: pullNumber, event: 'COMMENT', body: `### CodeReview.AI Automated Analysis 🤖\n\n${reviews.length > 0 ? finalAiMessage : 'LGTM! No issues found.'}` });
      } catch (githubErr: unknown) {
        finalAiMessage += `\n\n⚠️ **Failed to post to GitHub:** ${githubErr instanceof Error ? githubErr.message : String(githubErr)}`;
      }

      const aiMessage: Message = { role: 'assistant', content: finalAiMessage, timestamp: new Date().toLocaleTimeString() };
      setSessions(prev => prev.map(s => s.id === targetId ? { ...s, messages: [...s.messages, aiMessage] } : s));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to analyze PR.');
    } finally {
      setIsReviewing(false);
    }
  };

  return {
    code, setCode,
    isReviewing, setIsReviewing,
    focusModes, setFocusModes,
    error, setError,
    lang,
    createNewChat,
    deleteSession,
    handleReview,
    handleRepoSelect,
    handlePRSelect
  };
};
