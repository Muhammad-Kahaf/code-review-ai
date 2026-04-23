export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  timestamp: string;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  focusModes: string[];
  createdAt: number;
}

export interface User {
  name: string;
  email: string;
  avatar: string;
}

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  updated_at: string | null;
}

export interface GithubPR {
  id: number;
  number: number;
  title: string;
  html_url: string;
  created_at: string;
  user: { login: string };
  head: { ref: string; sha: string };
}

export interface GithubReview {
  path: string;
  line: number;
  body: string;
}

export interface LegacyReviewItem {
  code: string;
  content: string;
  timestamp: string;
}
export interface AgentSettings {
  repoFullName: string;
  autoFix: boolean;
  autoMerge: boolean;
  mergeScope?: 'all' | number;
  targetBranch?: string; // e.g. main, develop
  frequency: number; // minutes
  isActive: boolean;
  lastProcessedPR?: number;
}

export interface EngineeringTask {
  id: string;
  repoFullName: string;
  description: string;
  baseBranch?: string; // where to start from
  status: 'planning' | 'waiting_approval' | 'implementing' | 'completed' | 'failed';
  plan?: {
    plan: string;
    filesToModify: string[];
    filesToCreate: string[];
    branchName: string;
  };
  prUrl?: string;
  error?: string;
  verificationLogs?: string[];
  createdAt: number;
}

export interface LogEntry {
  id: string;
  type: 'agent' | 'bot' | 'system';
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  repoFullName: string;
  createdAt: string | number; // Firestore Timestamp
}
