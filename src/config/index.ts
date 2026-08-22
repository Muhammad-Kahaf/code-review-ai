export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
export const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
export const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'openai/gpt-oss-120b';

export const VALID_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.py', '.css', '.html', '.json', 
  '.md', '.java', '.cpp', '.c', '.go', '.rs', '.rb', '.php', 
  '.sh', '.yml', '.yaml'
];

export const DEFAULT_FOCUS_MODES = ['Security', 'Performance', 'Clean Code', 'Logic'];
