import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  GitForkIcon,
  ChevronLeft,
  X,
  Search,
  Key,
  Loader,
  GitPullRequest,
  FolderGit2,
  Lock,
  ExternalLink,
  Check
} from 'lucide-react';
import { Octokit } from '@octokit/rest';
import type { GithubRepo, GithubPR } from '../../types';

interface GithubRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  githubToken: string;
  setGithubToken?: (val: string) => void;
  onSelectRepo: (owner: string, repo: string, defaultBranch: string) => void;
  onSelectPR: (owner: string, repo: string, pullNumber: number) => void;
}

export const GithubRepoModal = ({
  isOpen,
  onClose,
  githubToken,
  setGithubToken,
  onSelectRepo,
  onSelectPR
}: GithubRepoModalProps) => {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [prs, setPrs] = useState<GithubPR[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPrs, setLoadingPrs] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [savedTokenMsg, setSavedTokenMsg] = useState(false);

  const hasValidToken = Boolean(
    githubToken &&
    githubToken.trim().length > 10 &&
    (githubToken.startsWith('ghp_') || githubToken.startsWith('github_pat_') || githubToken.startsWith('gho_'))
  );

  useEffect(() => {
    if (!isOpen) return;
    setSelectedRepo(null);
    setSearch('');
    setError('');

    // DO NOT call API if token is not provided
    if (!hasValidToken) {
      setRepos([]);
      setLoading(false);
      return;
    }

    const fetchRepos = async () => {
      setLoading(true);
      setError('');
      try {
        const octokit = new Octokit({ auth: githubToken.trim() });
        const { data } = await octokit.rest.repos.listForAuthenticatedUser({
          sort: 'updated',
          per_page: 50
        });
        setRepos(data as unknown as GithubRepo[]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Invalid GitHub Token. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [isOpen, githubToken, hasValidToken]);

  const handleSaveInlineToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim() || !setGithubToken) return;
    setGithubToken(inputToken.trim());
    setSavedTokenMsg(true);
    setTimeout(() => setSavedTokenMsg(false), 2000);
  };

  const handleRepoClick = async (repo: GithubRepo) => {
    if (!hasValidToken) return;
    setSelectedRepo(repo);
    setLoadingPrs(true);
    setPrs([]);
    setError('');
    const [owner, name] = repo.full_name.split('/');
    try {
      const octokit = new Octokit({ auth: githubToken.trim() });
      const { data } = await octokit.rest.pulls.list({
        owner,
        repo: name,
        state: 'open',
        sort: 'updated',
        direction: 'desc'
      });
      setPrs(data as unknown as GithubPR[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch PRs');
    } finally {
      setLoadingPrs(false);
    }
  };

  const filteredRepos = repos.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface w-full max-w-2xl h-[80dvh] rounded-2xl border border-border flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {selectedRepo ? (
              <button
                onClick={() => setSelectedRepo(null)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
              >
                <ChevronLeft size={16} /> Back to Repositories
              </button>
            ) : (
              <>
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-foreground rounded-lg">
                  <GitForkIcon size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">GitHub Repositories & PRs</h2>
                  <p className="text-[11px] text-muted">Select a repository or pull request to inspect</p>
                </div>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-hover rounded-lg text-muted hover:text-foreground transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Search Bar (Only when token exists & repos loaded) */}
        {!selectedRepo && hasValidToken && (
          <div className="p-3 border-b border-border bg-background shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={15} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter repositories..."
                className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-xl text-xs outline-none focus:border-zinc-500 transition-all font-mono placeholder:text-muted/50 text-foreground"
              />
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 relative scrollbar-hide">
          {!hasValidToken ? (
            /* Friendly Token Required Prompt */
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-5 my-auto h-full">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-muted">
                <Key size={22} />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-sm font-bold text-foreground">GitHub Access Token Required</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Provide a Personal Access Token to list your private repositories and audit pull requests.
                </p>
              </div>

              {setGithubToken && (
                <form onSubmit={handleSaveInlineToken} className="w-full max-w-sm space-y-3 pt-1">
                  <div className="relative">
                    <input
                      type="password"
                      value={inputToken}
                      onChange={(e) => setInputToken(e.target.value)}
                      placeholder="ghp_... (paste GitHub token)"
                      className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-xs font-mono text-foreground outline-none focus:border-zinc-500 transition-all placeholder:text-muted/40"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={!inputToken.trim()}
                      className="flex-1 py-2 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {savedTokenMsg ? <Check size={14} className="text-emerald-500" /> : null}
                      <span>{savedTokenMsg ? 'Connected!' : 'Connect Token'}</span>
                    </button>
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl border border-border text-muted hover:text-foreground hover:bg-surface-hover transition-colors flex items-center gap-1 text-[11px]"
                      title="Create token on GitHub"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </form>
              )}
            </div>
          ) : selectedRepo ? (
            /* Selected Repo Pull Requests View */
            <div className="space-y-4">
              <div className="p-4 border border-border bg-background rounded-xl flex items-center justify-between shadow-xs">
                <div>
                  <h3 className="font-bold text-foreground text-sm">{selectedRepo.name}</h3>
                  <p className="text-[11px] text-muted mt-0.5">Scan entire repository branch</p>
                </div>
                <button
                  onClick={() => onSelectRepo(selectedRepo.full_name.split('/')[0], selectedRepo.name, 'main')}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  Audit Repository
                </button>
              </div>

              <div className="pt-2">
                <h4 className="px-1 text-[10px] font-mono font-bold uppercase text-muted tracking-wider mb-2 flex items-center gap-1.5">
                  <GitPullRequest size={12} className="text-emerald-500" />
                  Open Pull Requests
                </h4>
                {error && (
                  <div className="p-3 mb-3 border border-red-500/20 bg-red-500/10 rounded-xl">
                    <p className="text-xs font-medium text-red-500 text-center">{error}</p>
                  </div>
                )}
                {loadingPrs ? (
                  <div className="py-12 flex items-center justify-center">
                    <Loader className="w-5 h-5 text-muted animate-spin" />
                  </div>
                ) : prs.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-border rounded-xl bg-background/50">
                    <p className="text-xs font-medium text-muted">No open pull requests found.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {prs.map(pr => (
                      <button
                        key={pr.id}
                        onClick={() => onSelectPR(selectedRepo.full_name.split('/')[0], selectedRepo.name, pr.number)}
                        className="w-full p-3 rounded-xl border border-border bg-background hover:bg-surface-hover transition-all text-left group flex gap-3 cursor-pointer"
                      >
                        <div className="text-emerald-500 shrink-0 mt-0.5"><GitPullRequest size={16} /></div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-foreground text-xs truncate">{pr.title}</h5>
                          <p className="text-[10px] text-muted mt-0.5 font-mono">
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
              <Loader className="w-5 h-5 text-muted animate-spin" />
              <p className="text-[10px] font-mono font-medium tracking-wider text-muted">Loading Repositories...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center space-y-2">
              <p className="text-xs font-medium text-red-500">{error}</p>
              {setGithubToken && (
                <button
                  type="button"
                  onClick={() => setGithubToken('')}
                  className="text-[11px] underline text-red-500 hover:text-red-400 font-semibold cursor-pointer"
                >
                  Clear and update token
                </button>
              )}
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="py-16 text-center text-xs font-medium text-muted">
              No repositories found.
            </div>
          ) : (
            filteredRepos.map(repo => (
              <motion.button
                key={repo.id}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                onClick={() => handleRepoClick(repo)}
                className="w-full p-3 rounded-xl border border-border bg-background hover:bg-surface-hover transition-all text-left group flex items-start gap-3 cursor-pointer"
              >
                <div className="p-1.5 bg-surface border border-border rounded-lg text-muted group-hover:text-foreground transition-colors shrink-0 mt-0.5">
                  <FolderGit2 size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-foreground truncate text-xs">{repo.name}</span>
                    {repo.private && (
                      <span className="px-1.5 py-0.2 rounded border border-amber-500/20 bg-amber-500/10 flex items-center gap-1 text-[8px] font-mono font-bold uppercase text-amber-500">
                        <Lock size={9} /> Private
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted truncate">{repo.description || 'No description provided'}</p>
                  <p className="text-[9px] text-muted/60 font-mono mt-1">
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
};
