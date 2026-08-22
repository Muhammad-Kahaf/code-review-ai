import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap, Code2, Database, Loader2, Sparkles, Terminal } from 'lucide-react';
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
    title: "Security & Auth Audit",
    desc: "Detect injection, token exposure & permission flaws",
    tag: "Security",
    code: `// Sample auth handler to review
async function handleUserLogin(req, res) {
  const { username, password } = req.body;
  // Query database directly
  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  const user = await db.raw(query);
  if (user) {
    const token = jwt.sign({ id: user.id, role: user.role }, "SECRET_KEY_123");
    return res.json({ token, user });
  }
  return res.status(401).send("Invalid credentials");
}`
  },
  {
    icon: Zap,
    title: "Performance & Re-renders",
    desc: "Find memory leaks, expensive loops & cache bugs",
    tag: "Performance",
    code: `// Sample React component with performance issues
function UserDashboard({ items, filter }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Heavy filtering on every render
    const filtered = items.filter(item => {
      const match = item.tags.some(t => t.toLowerCase() === filter.toLowerCase());
      return match && item.active;
    });
    setData(filtered);
  }, [items, filter]);

  return (
    <div>
      {data.map(item => (
        <UserProfile key={Math.random()} user={item} />
      ))}
    </div>
  );
}`
  },
  {
    icon: Code2,
    title: "Clean Architecture",
    desc: "Refactor nested logic into clean SOLID patterns",
    tag: "Clean Code",
    code: `// Sample complex function needing refactoring
function processOrder(order, user, discount) {
  if (order && order.items && order.items.length > 0) {
    let total = 0;
    for (let i = 0; i < order.items.length; i++) {
      let p = order.items[i].price;
      if (order.items[i].category === 'electronics') {
        p = p * 1.15;
      }
      total += p * order.items[i].qty;
    }
    if (user && user.isVIP) {
      total = total - (total * 0.2);
    } else if (discount) {
      total = total - discount;
    }
    return total;
  }
  return 0;
}`
  },
  {
    icon: Database,
    title: "Database & Async Logic",
    desc: "Inspect N+1 queries, race conditions & error handling",
    tag: "Logic",
    code: `// Sample async workflow with race conditions
async function syncTeamMembers(teamId, userIds) {
  const results = [];
  for (const id of userIds) {
    const user = await fetchUser(id);
    if (user.active) {
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
            transition={{ duration: 0.5 }}
            className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-8 my-auto"
          >
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 rounded-3xl flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/10">
                <Terminal size={36} strokeWidth={1.75} />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-background"></span>
              </span>
            </div>

            <div className="space-y-3 max-w-lg">
              <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight font-display">
                Universal Code Intelligence
              </h2>
              <p className="text-xs sm:text-sm text-muted font-medium leading-relaxed">
                Paste raw snippets, upload source files, or connect GitHub repos to run deep automated architectural & security reviews.
              </p>
            </div>

            {/* Starter Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left pt-2">
              {STARTER_PROMPTS.map((prompt, idx) => {
                const Icon = prompt.icon;
                return (
                  <motion.button
                    key={prompt.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    onClick={() => onSelectPrompt && onSelectPrompt(prompt.code)}
                    className="p-4 rounded-2xl bg-surface border border-border hover:border-emerald-500/40 hover:bg-surface-hover transition-all duration-200 group text-left flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                        <Icon size={18} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-background border border-border text-muted">
                        {prompt.tag}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                        {prompt.title}
                      </h3>
                      <p className="text-[11px] text-muted line-clamp-2 mt-0.5">
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
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                <Loader2 size={28} className="animate-spin" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-muted">
                Syncing Encrypted Session...
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

          {/* AI Thinking Stream Indicator */}
          {isReviewing && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 rounded-2xl bg-surface border border-emerald-500/20 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-foreground uppercase tracking-wider">AI Review Core</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      Analyzing AST & Pattern Heuristics...
                    </p>
                  </div>
                </div>
                <Loader2 size={18} className="animate-spin text-emerald-500" />
              </div>

              {/* Progress Skeleton Bar */}
              <div className="space-y-2 pt-2">
                <div className="h-2 w-full bg-emerald-500/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="h-full w-1/3 bg-emerald-500 rounded-full"
                  />
                </div>
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
