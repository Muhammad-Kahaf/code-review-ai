export interface Message {
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  timestamp: string;
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
