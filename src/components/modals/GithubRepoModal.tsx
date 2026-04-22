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
  Lock 
} from 'lucide-react';
import { Octokit } from '@octokit/rest';
import type { GithubRepo, GithubPR } from '../../types';

interface GithubRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  githubToken: string;
  onSelectRepo: (owner: string, repo: string, defaultBranch: string) => void;
  onSelectPR: (owner: string, repo: string, pullNumber: number) => void;
}

export const GithubRepoModal = ({
  isOpen,
  onClose,
  githubToken,
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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load repositories');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch PRs');
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
        className="bg-background w-full max-w-2xl h-[85dvh] rounded-[24px] border border-border flex flex-col shadow-2xl overflow-hidden"
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
