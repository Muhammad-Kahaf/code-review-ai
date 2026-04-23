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
  FolderGit, 
  Lock,
  Sparkles,
  Play,
  Bot,
  Terminal,
  ExternalLink,
  Clock,
  Zap,
  Activity,
  History,
  AlertCircle
} from 'lucide-react';
import { GithubService } from '../../services/githubService';
import { AgentService } from '../../services/agentService';
import { GROQ_API_KEY } from '../../config';
import { FirebaseService } from '../../services/firebaseService';
import { Octokit } from '@octokit/rest';
import type { GithubRepo, GithubPR, EngineeringTask, LogEntry } from '../../types';

type Issue = {
  id: number;
  number: number;
  title: string;
  body: string;
};

interface GithubRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | undefined;
  githubToken: string;
  onSelectRepo: (owner: string, repo: string, defaultBranch: string) => void;
  onSelectPR: (owner: string, repo: string, pullNumber: number) => void;
  isAgentProcessing?: boolean;
  provider?: 'google' | 'github';
}

export const GithubRepoModal = ({
  isOpen,
  onClose,
  userEmail,
  githubToken,
  onSelectRepo,
  onSelectPR,
  isAgentProcessing,
  provider
}: GithubRepoModalProps) => {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [prs, setPrs] = useState<GithubPR[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPrs, setLoadingPrs] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [agentConfig, setAgentConfig] = useState<{
    autoFix: boolean;
    autoMerge: boolean;
    isActive: boolean;
    targetBranch: string;
    mergeScope: 'all' | number;
  }>({
    autoFix: true,
    autoMerge: false,
    isActive: false,
    targetBranch: 'main',
    mergeScope: 'all'
  });
  const [activeMode, setActiveMode] = useState<'audit' | 'agent' | 'bot'>('audit');
  const [taskDescription, setTaskDescription] = useState('');
  const [baseBranch, setBaseBranch] = useState('main');
  const [tasks, setTasks] = useState<EngineeringTask[]>([]);
  const [isExecutingTask, setIsExecutingTask] = useState(false);
  const [branches, setBranches] = useState<{ name: string }[]>([]);
  const [repoIssues, setRepoIssues] = useState<{ id: number; number: number; title: string; body: string | null }[]>([]);
  const [repoLogs, setRepoLogs] = useState<LogEntry[]>([]);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isSavingAgent, setIsSavingAgent] = useState(false);
  const [agentMessage, setAgentMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
        
        // Load agent settings if any
        if (userEmail) {
          // (We could map these to the repos list if needed)
        }
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
    
    if (userEmail) {
       const agents = await FirebaseService.getAgents(userEmail);
       const existing = agents.find(a => a.repoFullName === repo.full_name);
       if (existing) {
          setAgentConfig({
            autoFix: existing.autoFix,
            autoMerge: existing.autoMerge,
            isActive: existing.isActive,
            targetBranch: existing.targetBranch || 'main',
            mergeScope: existing.mergeScope || 'all'
          });
        } else {
          setAgentConfig({ autoFix: true, autoMerge: false, isActive: false, targetBranch: 'main', mergeScope: 'all' });
        }
    }

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

    if (userEmail) {
      try {
        const [repoTasks, logs] = await Promise.all([
          FirebaseService.getTasks(userEmail, repo.full_name),
          FirebaseService.getLogs(userEmail, repo.full_name)
        ]);
        setTasks(repoTasks);
        setRepoLogs(logs);
      } catch (e) {
        console.error('Failed to load tasks/logs:', e);
      }
    }

    // Fetch Branches & Issues
    try {
      const [branchData, issueData] = await Promise.all([
        GithubService.getBranches(githubToken, owner, name),
        GithubService.getIssues(githubToken, owner, name)
      ]);
      setBranches(branchData);
      setRepoIssues(issueData as unknown as { id: number; number: number; title: string; body: string | null }[]);
    } catch (e) {
      console.error('Failed to fetch branches/issues:', e);
    }
  };

  useEffect(() => {
    const handleLiveLog = (event: Event) => {
      const customEvent = event as CustomEvent<LogEntry>;
      if (customEvent.detail.repoFullName === selectedRepo?.full_name) {
        setRepoLogs(prev => [customEvent.detail, ...prev]);
      }
    };

    window.addEventListener('agent-log', handleLiveLog);
    return () => window.removeEventListener('agent-log', handleLiveLog);
  }, [selectedRepo]);

  const pollLogs = async () => {
    if (!userEmail || !selectedRepo) return;
    try {
      const logs = await FirebaseService.getLogs(userEmail, selectedRepo.full_name);
      setRepoLogs(logs);
    } catch (err) {
      console.warn('Failed to poll logs:', err);
      if (err?.message?.includes('index')) {
        setError('CRITICAL: Firebase Index Missing. Activity history will not be saved correctly. [Fix in Console]');
      }
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isOpen && selectedRepo && userEmail) {
      interval = setInterval(pollLogs, 10000); // Poll logs every 10s
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, selectedRepo, userEmail]);

  const handleStartTask = async () => {
    if (!selectedRepo || !userEmail || !taskDescription.trim()) return;
    
    const newTask: EngineeringTask = {
      id: `task_${Date.now()}`,
      repoFullName: selectedRepo.full_name,
      description: taskDescription,
      baseBranch: baseBranch,
      status: 'planning',
      createdAt: Date.now()
    };

    setIsExecutingTask(true);
    setTasks(prev => [newTask, ...prev]);
    setTaskDescription('');

    try {
      await AgentService.generateTaskPlan(userEmail, githubToken, GROQ_API_KEY, newTask);
      const updated = await FirebaseService.getTasks(userEmail, selectedRepo.full_name);
      setTasks(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setIsExecutingTask(false);
    }
  };

  const handleApproveTask = async (task: EngineeringTask) => {
    if (!userEmail || !selectedRepo) return;
    setIsExecutingTask(true);
    try {
      await AgentService.applyTaskPlan(userEmail, githubToken, GROQ_API_KEY, task);
      const updated = await FirebaseService.getTasks(userEmail, selectedRepo.full_name);
      setTasks(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to apply plan');
    } finally {
      setIsExecutingTask(false);
    }
  };

  const handleSaveAgent = async () => {
    if (!selectedRepo || !userEmail) return;
    setIsSavingAgent(true);
    setAgentMessage(null);
    try {
      await FirebaseService.saveAgentSettings(userEmail!, selectedRepo!.full_name, {
        repoFullName: selectedRepo!.full_name,
        autoFix: agentConfig.autoFix,
        autoMerge: agentConfig.autoMerge,
        mergeScope: agentConfig.mergeScope,
        targetBranch: agentConfig.targetBranch,
        frequency: 5,
        isActive: agentConfig.isActive
      });

      setAgentMessage({ type: 'success', text: 'Agent settings saved successfully!' });

      // Trigger immediate scan if activated
      if (agentConfig.isActive) {
        setAgentMessage({ type: 'success', text: 'Agent activated! Starting initial scan...' });
        
        // Manual Live Feed Ping
        window.dispatchEvent(new CustomEvent('agent-log', { 
          detail: { 
            id: 'init_ping', 
            type: 'agent', 
            level: 'info', 
            message: 'Initializing Industrial Watcher Protocol...', 
            repoFullName: selectedRepo.full_name,
            createdAt: Date.now() 
          } 
        }));

        AgentService.processRepo(userEmail, githubToken, GROQ_API_KEY, {
          repoFullName: selectedRepo.full_name,
          autoFix: agentConfig.autoFix,
          autoMerge: agentConfig.autoMerge,
          targetBranch: agentConfig.targetBranch,
          frequency: 5,
          isActive: true
        }).then(() => {
          setAgentMessage({ type: 'success', text: 'Initial scan complete. Watcher is now live.' });
          pollLogs(); // Refresh logs
        }).catch(e => {
          console.error('Initial scan failed:', e);
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save agent settings';
      setAgentMessage({ type: 'error', text: msg });
      if (msg.includes('index')) {
        setError('Firebase Index Required: Please click the link in your browser console to enable logs.');
      }
    } finally {
      setIsSavingAgent(false);
      setTimeout(() => setAgentMessage(null), 5000);
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
              <div className="p-4 bg-muted/10 rounded-full">
                <Key className="w-10 h-10 text-muted/30" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground tracking-tight">GitHub Token Required</p>
                <p className="text-[11px] text-muted max-w-[240px] mx-auto mt-2 leading-relaxed">
                  {provider === 'github' ? (
                    <>Please <b>re-login with GitHub</b> to sync your access token automatically, or add a PAT in settings.</>
                  ) : (
                    <>Please add your <b>GitHub Personal Access Token</b> in the settings to connect your repositories.</>
                  )}
                </p>
              </div>
            </div>
          ) : selectedRepo ? (
            <div className="space-y-4 pb-10">
              {/* Critical Alerts & Index Fixer */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col gap-3 shadow-lg shadow-red-500/5">
                  <div className="flex items-center gap-3 text-red-500">
                    <AlertCircle size={18} />
                    <p className="text-xs font-black uppercase tracking-widest">{error}</p>
                  </div>
                  {error.includes('Index') && (
                    <a 
                      href="https://console.firebase.google.com/u/0/project/code-review-ai-3d2dd/firestore/indexes?create_composite=ClFwcm9qZWN0cy9jb2RlLXJldmlldy1haS0zZDJkZC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbG9ncy9pbmRleGVzL18QARoQCgxyZXBvRnVsbE5hbWUQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center py-3 bg-red-500 text-white rounded-xl font-black uppercase tracking-[0.2em] hover:bg-red-600 transition-all shadow-xl shadow-red-500/40 text-[11px] animate-pulse"
                    >
                      🚀 Launch Index Repair Tool
                    </a>
                  )}
                </div>
              )}
              {/* Choice Menu */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setActiveMode('audit')}
                  className={`p-3 rounded-2xl border transition-all text-left flex flex-col gap-2 ${activeMode === 'audit' ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500' : 'border-border bg-surface hover:border-emerald-500/30'}`}
                >
                  <div className={`p-1.5 rounded-lg w-fit ${activeMode === 'audit' ? 'bg-emerald-500 text-white' : 'bg-background text-muted'}`}>
                    <GitPullRequest size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-[11px]">Audit</p>
                    <p className="text-[8px] text-muted font-bold uppercase tracking-widest mt-0.5">Manual</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveMode('agent')}
                  className={`p-3 rounded-2xl border transition-all text-left flex flex-col gap-2 ${activeMode === 'agent' ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500' : 'border-border bg-surface hover:border-blue-500/30'}`}
                >
                  <div className={`p-1.5 rounded-lg w-fit ${activeMode === 'agent' ? 'bg-blue-500 text-white' : 'bg-background text-muted'}`}>
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-[11px]">Agent</p>
                    <p className="text-[8px] text-muted font-bold uppercase tracking-widest mt-0.5">Watcher</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveMode('bot')}
                  className={`p-3 rounded-2xl border transition-all text-left flex flex-col gap-2 ${activeMode === 'bot' ? 'border-purple-500 bg-purple-500/5 ring-1 ring-purple-500' : 'border-border bg-surface hover:border-purple-500/30'}`}
                >
                  <div className={`p-1.5 rounded-lg w-fit ${activeMode === 'bot' ? 'bg-purple-500 text-white' : 'bg-background text-muted'}`}>
                    <Bot size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-[11px]">Bot</p>
                    <p className="text-[8px] text-muted font-bold uppercase tracking-widest mt-0.5">Engineer</p>
                  </div>
                </button>
                <div className="p-3 rounded-2xl border border-border bg-surface flex flex-col gap-2">
                   <div className="p-1.5 rounded-lg w-fit bg-amber-500/10 text-amber-500">
                     <Activity size={14} />
                   </div>
                   <div>
                     <p className="font-bold text-foreground text-[11px]">Pulse</p>
                     <p className="text-[8px] text-muted font-bold uppercase tracking-widest mt-0.5">98% Health</p>
                   </div>
                </div>
              </div>

              {activeMode === 'agent' ? (

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="p-6 border border-blue-500/20 bg-blue-500/5 rounded-2xl space-y-6">
                       <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg shadow-lg transition-all ${isAgentProcessing ? 'bg-blue-500 text-white animate-pulse shadow-blue-500/50' : 'bg-zinc-800 text-zinc-500'}`}>
                           <Zap size={16} />
                         </div>
                         <div>
                           <p className="font-bold text-foreground">Protocol {agentConfig.isActive ? 'Armed' : 'Standby'}</p>
                           {isAgentProcessing && <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest animate-pulse">Scanning Codebase...</p>}
                         </div>
                       </div>
                       <button 
                        onClick={() => setAgentConfig(prev => ({ ...prev, isActive: !prev.isActive }))}
                        className={`w-12 h-6 rounded-full transition-all relative ${agentConfig.isActive ? 'bg-blue-500' : 'bg-zinc-700'}`}
                       >
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${agentConfig.isActive ? 'left-7' : 'left-1'}`} />
                       </button>
                     </div>

                     <div className="space-y-4 border-t border-blue-500/10 pt-4">
                       <div className="flex items-center justify-between group">
                         <div>
                           <p className="text-xs font-bold text-foreground">Auto-Fix Issues</p>
                           <p className="text-[10px] text-muted">AI will commit fixes for logical errors</p>
                         </div>
                         <button 
                          onClick={() => setAgentConfig(prev => ({ ...prev, autoFix: !prev.autoFix }))}
                          className={`w-10 h-5 rounded-full transition-all relative ${agentConfig.autoFix ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                         >
                           <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${agentConfig.autoFix ? 'left-5.5' : 'left-0.5'}`} />
                         </button>
                       </div>

                       <div className="flex items-center justify-between group">
                         <div>
                           <p className="text-xs font-bold text-foreground">Auto-Merge PRs</p>
                           <p className="text-[10px] text-muted">Merge automatically after audit/fix</p>
                         </div>
                         <button 
                          onClick={() => setAgentConfig(prev => ({ ...prev, autoMerge: !prev.autoMerge }))}
                          className={`w-10 h-5 rounded-full transition-all relative ${agentConfig.autoMerge ? 'bg-amber-500' : 'bg-zinc-700'}`}
                         >
                           <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${agentConfig.autoMerge ? 'left-5.5' : 'left-0.5'}`} />
                         </button>
                       </div>
                        
                        {agentConfig.autoMerge && (
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div>
                              <label className="text-[10px] font-black uppercase text-muted tracking-widest mb-1.5 block px-1">Target Branch</label>
                              <select 
                                value={agentConfig.targetBranch}
                                onChange={(e) => setAgentConfig(prev => ({ ...prev, targetBranch: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs outline-none focus:border-blue-500/50 transition-all font-medium text-foreground appearance-none cursor-pointer"
                              >
                                {branches.map((b: { name: string }) => (
                                  <option key={b.name} value={b.name}>{b.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase text-muted tracking-widest mb-1.5 block px-1">Merge Scope</label>
                              <select 
                                value={agentConfig.mergeScope}
                                onChange={(e) => setAgentConfig(prev => ({ ...prev, mergeScope: e.target.value === 'all' ? 'all' : parseInt(e.target.value) }))}
                                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs outline-none focus:border-blue-500/50 transition-all font-medium text-foreground appearance-none cursor-pointer"
                              >
                                <option value="all">All Pull Requests</option>
                                {prs.map(pr => (
                                  <option key={pr.id} value={pr.number}>PR #{pr.number} only</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <h5 className="text-[10px] font-black uppercase text-muted tracking-[0.2em] flex items-center gap-2">
                            <Terminal size={10} className="text-blue-500" /> Live System Feed
                          </h5>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                            <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Live</span>
                          </div>
                        </div>
                        <div className="bg-[#050507] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                          <div className="bg-zinc-900/50 px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between">
                             <div className="flex gap-1">
                               <div className="w-2 h-2 rounded-full bg-red-500/20" />
                               <div className="w-2 h-2 rounded-full bg-amber-500/20" />
                               <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
                             </div>
                             <p className="text-[8px] text-zinc-500 font-mono tracking-widest uppercase">Agent Console v1.0</p>
                          </div>
                          <div className="p-3 divide-y divide-zinc-800/50 max-h-64 overflow-y-auto font-mono scrollbar-hide">
                            {repoLogs.filter(l => l.type === 'agent').length === 0 ? (
                              <div className="py-8 text-center">
                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-zinc-800 border-t-blue-500 mb-2" />
                                <p className="text-[10px] text-zinc-600 italic">Initializing live feed...</p>
                              </div>
                            ) : (
                              repoLogs.filter(l => l.type === 'agent').map(log => (
                                <div key={log.id} className="py-2.5 flex items-start gap-3 group animate-in fade-in slide-in-from-left-2 duration-300">
                                  <span className="text-[10px] text-zinc-700 shrink-0 mt-0.5 select-none">{">"}</span>
                                  <div className="min-w-0 flex-1">
                                    <p className={`text-[11px] leading-relaxed font-medium ${
                                      log.level === 'success' ? 'text-emerald-400' :
                                      log.level === 'error' ? 'text-red-400' :
                                      log.level === 'warn' ? 'text-amber-400' : 'text-blue-300'
                                    }`}>{log.message}</p>
                                    <div className="flex items-center gap-2 mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                       <p className="text-[8px] text-zinc-500">
                                          {log.createdAt && new Date(
                                            typeof log.createdAt === 'number' 
                                              ? log.createdAt 
                                              : (log.createdAt as unknown as { seconds: number }).seconds * 1000
                                          ).toLocaleTimeString([], { hour12: false })}
                                       </p>
                                       <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                                       <p className="text-[8px] text-zinc-500 uppercase tracking-tighter">{log.level}</p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {agentMessage && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          className={`p-3 rounded-xl text-xs font-bold text-center ${
                            agentMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}
                        >
                          {agentMessage.text}
                        </motion.div>
                      )}

                      <button 
                       onClick={handleSaveAgent}
                       disabled={isSavingAgent}
                       className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                      >
                        {isSavingAgent ? <Loader size={16} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                        {isSavingAgent ? 'Saving Configuration...' : (agentConfig.isActive ? 'Update Watcher' : 'Activate Watcher')}
                      </button>
                  </div>
                </motion.div>
              ) : activeMode === 'bot' ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="p-6 border border-purple-500/20 bg-purple-500/5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500 text-white rounded-lg"><Terminal size={18} /></div>
                      <h4 className="font-bold text-foreground">Assign Autonomous Task</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-muted tracking-widest mb-1.5 block">Base Branch</label>
                        <select 
                          value={baseBranch}
                          onChange={(e) => setBaseBranch(e.target.value)}
                          className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs outline-none focus:border-purple-500/50 transition-all font-medium text-foreground appearance-none cursor-pointer"
                        >
                          {branches.map((b: { name: string }) => (
                            <option key={b.name} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      {repoIssues.length > 0 && (
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-muted tracking-widest block">Quick Fix: GitHub Issues</label>
                           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                              {repoIssues.map((issue: Issue) => (
                                <button 
                                  key={issue.id}
                                  onClick={() => setTaskDescription(`Fix Issue #${issue.number}: ${issue.title}\n\nDescription: ${issue.body || ''}`)}
                                  className="shrink-0 px-3 py-2 bg-purple-500/5 border border-purple-500/20 rounded-xl hover:bg-purple-500/10 transition-all text-left max-w-[200px]"
                                >
                                   <p className="text-[10px] font-bold text-purple-500 mb-0.5 truncate">#{issue.number}</p>
                                   <p className="text-[9px] text-foreground font-medium truncate">{issue.title}</p>
                                </button>
                              ))}
                           </div>
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] font-black uppercase text-muted tracking-widest mb-1.5 block">Task Description</label>
                        <textarea 
                          value={taskDescription}
                          onChange={(e) => setTaskDescription(e.target.value)}
                          placeholder="e.g., Add a dark mode toggle to the login page..."
                          className="w-full h-24 p-4 bg-surface border border-border rounded-xl text-sm outline-none focus:border-purple-500/50 transition-all resize-none text-foreground"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleStartTask}
                      disabled={isExecutingTask || !taskDescription.trim()}
                      className="w-full py-3 bg-purple-500 text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-sm flex items-center justify-center gap-2"
                    >
                      {isExecutingTask ? <Loader size={16} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                      {isExecutingTask ? 'Engineering in Progress...' : 'Launch Engineer'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h5 className="text-[10px] font-black uppercase text-muted tracking-widest flex items-center gap-2">
                        <History size={10} className="text-purple-500" /> Engineering Logs
                      </h5>
                    </div>
                    <div className="bg-[#09090b] border border-zinc-800 rounded-2xl divide-y divide-zinc-800 overflow-hidden max-h-48 overflow-y-auto font-mono">
                      {repoLogs.filter(l => l.type === 'bot').length === 0 ? (
                        <div className="p-4 text-center text-[10px] text-zinc-500 italic">No engineering logs yet</div>
                      ) : (
                        repoLogs.filter(l => l.type === 'bot').map(log => (
                          <div key={log.id} className="p-3 flex items-start gap-3 bg-black/20">
                            <span className="text-[10px] text-zinc-600 shrink-0 mt-0.5">#</span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-[11px] leading-relaxed ${
                                log.level === 'success' ? 'text-emerald-400' :
                                log.level === 'error' ? 'text-red-400' :
                                log.level === 'warn' ? 'text-amber-400' : 'text-purple-400'
                              }`}>{log.message}</p>
                              <p className="text-[8px] text-zinc-600 mt-1">
                                {log.createdAt && new Date(
                                  typeof log.createdAt === 'number' 
                                    ? log.createdAt 
                                    : (log.createdAt as unknown as { seconds: number }).seconds * 1000
                                ).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase text-muted tracking-widest px-1">Planned Tasks</h5>
                    {tasks.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl">
                        <p className="text-xs text-muted">No autonomous tasks launched yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tasks.map(task => (
                          <div key={task.id} className="space-y-1">
                            <div 
                              onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                              className={`p-4 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                                expandedTaskId === task.id ? 'border-purple-500 bg-purple-500/5' : 'border-border bg-surface hover:border-purple-500/30'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-bold text-foreground text-sm truncate">{task.description}</p>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                    task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                                    task.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                                    'bg-purple-500/10 text-purple-500 animate-pulse'
                                  }`}>
                                    {task.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-muted font-bold">
                                  <span className="flex items-center gap-1"><Clock size={10} /> {new Date(task.createdAt).toLocaleDateString()}</span>
                                  {task.plan?.branchName && <span className="flex items-center gap-1"><GitForkIcon size={10} /> {task.plan.branchName}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {task.prUrl && (
                                  <a 
                                    href={task.prUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2 bg-purple-500/10 text-purple-500 rounded-lg hover:bg-purple-500 hover:text-white transition-all"
                                  >
                                    <ExternalLink size={16} />
                                  </a>
                                )}
                                <div className={`p-1 rounded-md text-muted group-hover:text-foreground transition-transform ${expandedTaskId === task.id ? 'rotate-180' : ''}`}>
                                  <ChevronLeft size={14} className="-rotate-90" />
                                </div>
                              </div>
                            </div>
                            
                            {expandedTaskId === task.id && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="overflow-hidden bg-surface/50 border-x border-b border-border rounded-b-xl -mt-2 p-4 pt-6 space-y-3"
                              >
                                {task.status === 'failed' && task.error && (
                                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <p className="text-[10px] font-black uppercase text-red-500 mb-1 flex items-center gap-2">
                                      <AlertCircle size={12} /> Failure Reason
                                    </p>
                                    <p className="text-xs text-foreground font-medium">{task.error}</p>
                                  </div>
                                )}
                                
                                {task.plan && (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <p className="text-[10px] font-black uppercase text-muted tracking-widest px-1">Implementation Plan</p>
                                      {task.status === 'waiting_approval' && (
                                        <div className="flex gap-2">
                                          <button 
                                            onClick={() => handleApproveTask(task)}
                                            className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1"
                                          >
                                            <Play size={10} fill="currentColor" /> Approve & Deploy
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="bg-background/50 rounded-lg p-3 border border-border">
                                      <p className="text-[11px] text-foreground leading-relaxed whitespace-pre-wrap">{task.plan.plan}</p>
                                    </div>
                                    
                                    {(task.plan.filesToModify?.length > 0 || task.plan.filesToCreate?.length > 0) && (
                                      <div className="flex flex-wrap gap-1.5 pt-1">
                                        {task.plan.filesToCreate?.map(f => (
                                          <span key={f} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-bold">CREATE: {f}</span>
                                        ))}
                                        {task.plan.filesToModify?.map(f => (
                                          <span key={f} className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[9px] font-bold">MODIFY: {f}</span>
                                        ))}
                                      </div>
                                    )}

                                    {task.verificationLogs && task.verificationLogs.length > 0 && (
                                      <div className="pt-2 border-t border-border">
                                        <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">Self-Audit Log</p>
                                        {task.verificationLogs.map((log, i) => (
                                          <p key={i} className="text-[10px] text-muted italic">"{log}"</p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                       <p className="text-[9px] font-black uppercase text-emerald-500 tracking-tighter mb-1">Total PRs Analyzed</p>
                       <p className="text-2xl font-black text-foreground">12</p>
                    </div>
                    <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                       <p className="text-[9px] font-black uppercase text-blue-500 tracking-tighter mb-1">Autonomous Fixes</p>
                       <p className="text-2xl font-black text-foreground">08</p>
                    </div>
                  </div>

                  <div className="p-5 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 bg-emerald-500/10 blur-3xl rounded-full -mr-10 -mt-10" />
                    <div className="relative z-10">
                      <h3 className="font-bold text-foreground text-lg">{selectedRepo!.name}</h3>
                      <p className="text-xs text-muted uppercase tracking-widest font-bold mt-1">Full Codebase Scan</p>
                    </div>
                    <button
                      onClick={() => onSelectRepo(selectedRepo!.full_name.split('/')[0], selectedRepo!.name, 'main')}
                      className="relative z-10 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 text-sm"
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
                            onClick={() => onSelectPR(selectedRepo!.full_name.split('/')[0], selectedRepo!.name, pr.number)}
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
              )}
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
                  <FolderGit size={18} />
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
