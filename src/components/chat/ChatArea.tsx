import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap, Code2, Database, Loader2, Binary, Cpu } from 'lucide-react';
import type { ChatSession } from '../../types';
import { MessageItem } from './MessageItem';

interface ChatAreaProps {
  activeSession: ChatSession | undefined;
  activeId: string | null | undefined;
  isReviewing: boolean;
  isLoadingMessages: boolean;
  downloadReport: (content: string) => void;
  onSelectPrompt?: (code: string) => void;
}

const STARTER_PROMPTS = [
  {
    icon: ShieldCheck,
    title: "SAST & Security Vulnerabilities",
    desc: "Detect SQL injection, secret leakage, OWASP Top 10 flaws & broken auth.",
    tag: "SECURITY",
    code: `// Sample auth handler with critical security vulnerabilities
async function handleUserLogin(req, res) {
  const { username, password } = req.body;
  
  // Unsanitized SQL query (SQL Injection risk)
  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  const user = await db.raw(query);
  
  if (user) {
    // Hardcoded secret key & sensitive data exposure
    const token = jwt.sign({ id: user.id, role: user.role, ssn: user.ssn }, "DEV_JWT_SECRET_KEY_123");
    return res.json({ token, user });
  }
  return res.status(401).send("Invalid credentials");
}`
  },
  {
    icon: Zap,
    title: "Performance & Resource Efficiency",
    desc: "Diagnose O(n²) bottlenecks, memory leaks, unmemoized loops & cache bugs.",
    tag: "PERFORMANCE",
    code: `// Sample component with re-render cascades & memory leaks
function UserDashboard({ items, filter, onSelect }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Heavy unoptimized computation inside un-debounced effect
    const filtered = items.filter(item => {
      const match = item.tags.some(t => t.toLowerCase() === filter.toLowerCase());
      return match && item.active;
    });
    setData(filtered);
  }, [items, filter]);

  return (
    <div className="grid grid-cols-3 gap-4">
      {data.map(item => (
        <UserProfile key={Math.random()} user={item} onClick={() => onSelect(item)} />
      ))}
    </div>
  );
}`
  },
  {
    icon: Code2,
    title: "Architecture & SOLID Principles",
    desc: "Refactor high cyclomatic complexity, tight coupling & nested branching.",
    tag: "CLEAN CODE",
    code: `// Sample business logic with high cyclomatic complexity
function processOrder(order, user, discountCode, paymentType) {
  if (order && order.items && order.items.length > 0) {
    let total = 0;
    for (let i = 0; i < order.items.length; i++) {
      let p = order.items[i].price;
      if (order.items[i].category === 'electronics') {
        p = p * 1.15;
      } else if (order.items[i].category === 'apparel') {
        p = p * 1.08;
      }
      total += p * order.items[i].qty;
    }
    if (user && user.isVIP) {
      total = total - (total * 0.2);
    } else if (discountCode === 'SPRING50') {
      total = total - 50;
    }
    if (paymentType === 'crypto') {
      total += 15; // Network surcharge
    }
    return total > 0 ? total : 0;
  }
  return 0;
}`
  },
  {
    icon: Database,
    title: "Concurrency & Async Resilience",
    desc: "Detect race conditions, N+1 queries, unhandled rejections & deadlock risks.",
    tag: "ASYNC & DB",
    code: `// Sample async workflow with N+1 queries & unhandled race conditions
async function syncTeamMembers(teamId, userIds) {
  const results = [];
  // Sequential N+1 database queries
  for (const id of userIds) {
    const user = await db.table('users').where({ id }).first();
    if (user && user.active) {
      await db.table('team_members').insert({ team_id: teamId, user_id: id });
      results.push(user);
    }
  }
  return results;
}`
  }
];

export const ChatArea = ({
  activeSession,
  activeId,
  isReviewing,
  isLoadingMessages,
  downloadReport,
  onSelectPrompt
}: ChatAreaProps) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages.length, isReviewing]);

  const hasMessages = activeSession && activeSession.messages && activeSession.messages.length > 0;
  const showHero = (!activeId || !hasMessages) && !isReviewing && !isLoadingMessages;

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 sm:py-10 scroll-smooth">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 space-y-8">
        
        {/* Empty State / Quick Launch Hero */}
        {showHero && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-8 my-auto"
          >
            {/* Engineering Badge */}
            <div className="flex flex-col items-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold">
                <Binary size={14} className="text-emerald-500" />
                <span>Automated Static Analysis & Code Audit</span>
              </div>

              <div className="space-y-2 max-w-xl">
                <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight font-display">
                  Precision Engineering & Security Audits
                </h2>
                <p className="text-xs sm:text-sm text-muted font-normal leading-relaxed">
                  AST inspection, OWASP vulnerability diagnostics, performance profiling, and pull request governance.
                </p>
              </div>
            </div>

            {/* Starter Audit Templates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-2xl text-left pt-2">
              {STARTER_PROMPTS.map((prompt, idx) => {
                const Icon = prompt.icon;
                return (
                  <motion.button
                    key={prompt.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    onClick={() => onSelectPrompt && onSelectPrompt(prompt.code)}
                    className="p-4 rounded-xl bg-surface border border-border hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-surface-hover transition-all duration-200 group text-left flex flex-col justify-between space-y-3 shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:text-emerald-500 transition-colors">
                        <Icon size={16} />
                      </div>
                      <span className="text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-background border border-border text-muted">
                        {prompt.tag}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                        {prompt.title}
                      </h3>
                      <p className="text-[11px] text-muted line-clamp-2 mt-0.5 leading-snug">
                        {prompt.desc}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Message Stream */}
        <AnimatePresence mode="popLayout">
          {isLoadingMessages ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 space-y-4 text-center"
            >
              <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-border text-zinc-600 dark:text-zinc-300">
                <Loader2 size={24} className="animate-spin text-emerald-500" />
              </div>
              <p className="text-[11px] font-mono font-medium tracking-wider text-muted">
                Loading Audit Report...
              </p>
            </motion.div>
          ) : (
            activeSession?.messages.map((msg, i) => (
              <MessageItem 
                key={msg.id || i} 
                message={msg} 
                downloadReport={downloadReport} 
              />
            ))
          )}

          {/* Engine Execution Progress */}
          {isReviewing && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-5 rounded-xl bg-surface border border-border shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center shadow-xs">
                    <Cpu size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground font-mono">Static Analysis Engine</p>
                    <p className="text-[10px] text-muted font-medium flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Parsing Abstract Syntax Tree (AST) & Evaluating Rulesets...
                    </p>
                  </div>
                </div>
                <Loader2 size={16} className="animate-spin text-muted" />
              </div>

              {/* Progress Line */}
              <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  className="h-full w-1/3 bg-emerald-500 rounded-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll Anchor */}
        <div ref={chatEndRef} className="h-36 sm:h-44" />
      </div>
    </div>
  );
};
