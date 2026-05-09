import React, { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Send, Loader2, Sparkles, Search, Users, BookOpen,
  FileText, X, RefreshCw, ChevronDown, Filter, Download,
  MessageSquare, Star, Mail, Phone, Globe, Tag, TrendingUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

// ─── Quick filter chips ───────────────────────────────────────────────────────
const QUICK_FILTERS = [
  { label: 'All Leads', query: 'Show me all leads sorted by follower count' },
  { label: '10K+ Followers', query: 'Find leads with over 10,000 followers' },
  { label: 'Has Email', query: 'Show leads that have an email address' },
  { label: 'High Score A+', query: 'Show me A-grade leads with high lead scores' },
  { label: 'Converted', query: 'Show converted leads' },
  { label: 'Fitness Niche', query: 'Find fitness and health influencers' },
  { label: 'PLR Content', query: 'Search for PLR articles and ebooks in the database' },
  { label: 'Unresponsive', query: 'Show unresponsive leads for re-engagement' },
];

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className="rounded-xl p-3 flex items-center gap-3"
      style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
      <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}20` }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div>
        <div className="text-lg font-bold leading-none" style={{ color }}>{value}</div>
        <div className="text-[10px] mt-0.5" style={{ color: '#9ea7b5' }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MsgBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'linear-gradient(135deg, #ea00ea, #4acbbf)' }}>
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {msg.content && (
          <div className="rounded-2xl px-4 py-3"
            style={{
              background: isUser ? 'rgba(234,0,234,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${isUser ? 'rgba(234,0,234,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: '#fff',
            }}>
            <ReactMarkdown
              className="text-sm prose prose-invert prose-sm max-w-none"
              components={{
                p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                strong: ({ children }) => <strong style={{ color: '#4acbbf' }}>{children}</strong>,
                ul: ({ children }) => <ul className="my-1 ml-4 list-disc space-y-0.5">{children}</ul>,
                li: ({ children }) => <li className="text-sm" style={{ color: '#d7dde5' }}>{children}</li>,
                code: ({ children }) => <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(74,203,191,0.15)', color: '#4acbbf' }}>{children}</code>,
              }}>
              {msg.content}
            </ReactMarkdown>
          </div>
        )}
        {msg.tool_calls?.map((tc, i) => (
          <div key={i} className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-2"
            style={{ background: 'rgba(248,212,23,0.08)', border: '1px solid rgba(248,212,23,0.2)', color: '#f8d417' }}>
            <Database className="h-3 w-3" />
            <span>{tc.name?.replace(/_/g, ' ')} {['running','in_progress','pending'].includes(tc.status) ? '…' : tc.status === 'completed' ? '✓' : ''}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Smart Search Panel ───────────────────────────────────────────────────────
function SmartSearchPanel({ onResults }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [filterUsed, setFilterUsed] = useState(null);
  const [showFilter, setShowFilter] = useState(false);

  const runSearch = async (q) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setResults(null);
    setFilterUsed(null);
    try {
      const res = await base44.functions.invoke('aiLeadAssistant', {
        action: 'smart_search',
        criteria: { query: searchQuery }
      });
      setResults(res.data?.leads || []);
      setFilterUsed(res.data?.filter_used);
      if (onResults) onResults(res.data?.leads || []);
    } catch (e) {
      toast.error('Search failed: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!results?.length) return;
    const headers = ['username', 'name', 'category', 'followerCount', 'email', 'phone', 'status', 'lead_grade', 'tag'];
    const csv = [headers.join(','), ...results.map(l => headers.map(h => `"${l[h] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `search-results-${Date.now()}.csv`;
    a.click();
    toast.success('Exported!');
  };

  const fmt = (n) => {
    if (!n) return '—';
    if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n/1e3).toFixed(0)}K`;
    return String(n);
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(10,18,30,0.95)', border: '1.5px solid rgba(74,203,191,0.3)' }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(74,203,191,0.15)', background: 'rgba(74,203,191,0.05)' }}>
        <Search className="h-4 w-4" style={{ color: '#4acbbf' }} />
        <span className="text-sm font-bold" style={{ color: '#4acbbf' }}>AI Smart Search</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full ml-auto" style={{ background: 'rgba(74,203,191,0.15)', color: '#4acbbf' }}>Natural Language</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <Input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runSearch()}
            placeholder='Try: "fitness coaches in Miami with 10k+ followers and email"'
            style={{ background: '#071a2c', borderColor: 'rgba(74,203,191,0.4)', color: '#fff' }}
            className="text-sm placeholder:text-gray-600 flex-1" />
          <Button onClick={() => runSearch()} disabled={loading || !query.trim()}
            style={{ background: 'linear-gradient(135deg, #4acbbf, #54b0e7)', color: '#0a1929' }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {/* Quick chips */}
        <div className="flex flex-wrap gap-1.5">
          {QUICK_FILTERS.map(f => (
            <button key={f.label} onClick={() => { setQuery(f.query); runSearch(f.query); }}
              className="text-xs px-2.5 py-1 rounded-full transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#9ea7b5', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,203,191,0.12)'; e.currentTarget.style.color = '#4acbbf'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#9ea7b5'; }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Filter display */}
        {filterUsed && (
          <div className="rounded-lg px-3 py-2 flex items-center gap-2 cursor-pointer" onClick={() => setShowFilter(!showFilter)}
            style={{ background: 'rgba(248,212,23,0.06)', border: '1px solid rgba(248,212,23,0.2)' }}>
            <Filter className="h-3 w-3" style={{ color: '#f8d417' }} />
            <span className="text-[10px] font-semibold" style={{ color: '#f8d417' }}>AI-generated filter</span>
            <ChevronDown className={`h-3 w-3 ml-auto transition-transform ${showFilter ? 'rotate-180' : ''}`} style={{ color: '#f8d417' }} />
          </div>
        )}
        {showFilter && filterUsed && (
          <pre className="text-[10px] p-3 rounded-lg overflow-x-auto" style={{ background: '#071a2c', color: '#4acbbf', border: '1px solid rgba(74,203,191,0.2)' }}>
            {JSON.stringify(filterUsed, null, 2)}
          </pre>
        )}

        {/* Results */}
        {results !== null && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: results.length > 0 ? '#4acbbf' : '#9ea7b5' }}>
                {results.length} result{results.length !== 1 ? 's' : ''}
              </span>
              {results.length > 0 && (
                <Button size="sm" onClick={exportCSV}
                  style={{ background: 'rgba(74,203,191,0.15)', color: '#4acbbf', border: '1px solid rgba(74,203,191,0.3)' }}>
                  <Download className="h-3 w-3 mr-1" /> Export CSV
                </Button>
              )}
            </div>
            {results.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: '#5e6a78' }}>No leads matched your query. Try different keywords.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {results.map((lead, i) => (
                  <motion.div key={lead.id || i}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="rounded-xl p-3 flex items-start gap-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold"
                      style={{ background: 'linear-gradient(135deg, #ea00ea30, #4acbbf30)', color: '#4acbbf' }}>
                      {(lead.name?.[0] || lead.username?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold truncate" style={{ color: '#fff' }}>{lead.name || 'Unknown'}</span>
                        <span className="text-xs" style={{ color: '#4acbbf' }}>@{lead.username}</span>
                        {lead.lead_grade && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: lead.lead_grade === 'A' ? 'rgba(46,204,113,0.2)' : 'rgba(248,212,23,0.15)', color: lead.lead_grade === 'A' ? '#2ecc71' : '#f8d417' }}>
                            {lead.lead_grade}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {lead.category && <span className="text-[10px]" style={{ color: '#f8d417' }}>{lead.category}</span>}
                        {lead.followerCount > 0 && <span className="text-[10px]" style={{ color: '#9ea7b5' }}>{fmt(lead.followerCount)} followers</span>}
                        {lead.email && <span className="text-[10px]" style={{ color: '#4acbbf' }}>✉ email</span>}
                        {lead.phone && <span className="text-[10px]" style={{ color: '#54b0e7' }}>☎ phone</span>}
                        <span className="text-[10px] px-1.5 py-0.5 rounded ml-auto" style={{ background: 'rgba(94,106,120,0.2)', color: '#9ea7b5' }}>
                          {(lead.status || 'new').replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LegenDatabase() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tab, setTab] = useState('chat'); // 'chat' | 'search'
  const messagesEndRef = useRef(null);
  const initRef = useRef(false);

  const { data: stats } = useQuery({
    queryKey: ['legendatabase_stats'],
    queryFn: async () => {
      const leads = await base44.entities.Lead.list('-created_date', 1);
      const all = await base44.entities.Lead.list('-created_date', 5000);
      return {
        total: all.length,
        withEmail: all.filter(l => l.email).length,
        converted: all.filter(l => l.status === 'converted').length,
        gradeA: all.filter(l => l.lead_grade === 'A').length,
      };
    },
    staleTime: 60000,
  });

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      initChat();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      const msgs = data?.messages || [];
      setMessages(msgs);
      setIsProcessing(msgs.some(m => m?.tool_calls?.some(tc => ['running','in_progress','pending'].includes(tc?.status))));
    });
    return unsub;
  }, [conversation?.id]);

  const initChat = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'glytch',
        metadata: { name: 'LegenDatabase Session', created_date: new Date().toISOString() }
      });
      setConversation(conv);
      await base44.agents.addMessage(conv, {
        role: 'assistant',
        content: `## 👋 Welcome to LegenDatabase\n\nI'm **GLYTCH**, your AI butler for the Legendary Leads ecosystem.\n\nI can search and filter:\n- 🎯 **Leads** — by niche, location, followers, contact info, status, grade\n- 📚 **PLR Articles & Ebooks** — by topic, category, keyword\n- 📝 **Original Content** — any human-authored content in your database\n- 📊 **Analytics** — pipeline stats, conversion insights\n\n**Try asking:**\n- *"Find fitness coaches with 10k+ followers who have email"*\n- *"Show me PLR articles about social media marketing"*\n- *"Which leads are unresponsive and high-score?"*\n- *"Find beauty influencers in Miami"*`
      });
    } catch (e) {
      console.error('Failed to init GLYTCH chat:', e);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !conversation || isProcessing) return;
    const text = inputText;
    setInputText('');
    setIsProcessing(true);
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: text });
    } catch (e) {
      console.error('Send failed:', e);
      setIsProcessing(false);
    }
  };

  const newChat = async () => {
    setConversation(null);
    setMessages([]);
    initRef.current = false;
    initRef.current = true;
    await initChat();
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#0a1929' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ea00ea, #4acbbf)', boxShadow: '0 0 20px rgba(234,0,234,0.4)' }}>
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>
                LegenDatabase
              </h1>
              <p className="text-xs" style={{ color: '#9ea7b5' }}>AI-powered search · Leads · PLR Content · Ebooks · Articles</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={newChat} variant="ghost" style={{ color: '#9ea7b5', border: '1px solid rgba(255,255,255,0.1)' }}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> New Chat
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total Records" value={stats.total.toLocaleString()} color="#ea00ea" icon={Database} />
            <StatCard label="With Email" value={stats.withEmail.toLocaleString()} color="#4acbbf" icon={Mail} />
            <StatCard label="Converted" value={stats.converted.toLocaleString()} color="#2ecc71" icon={TrendingUp} />
            <StatCard label="Grade A Leads" value={stats.gradeA.toLocaleString()} color="#f8d417" icon={Star} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {[
            { id: 'chat', label: 'GLYTCH AI Chat', icon: MessageSquare },
            { id: 'search', label: 'Smart Search', icon: Search },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: tab === t.id ? 'linear-gradient(135deg, #ea00ea22, #4acbbf22)' : 'transparent',
                  color: tab === t.id ? '#4acbbf' : '#9ea7b5',
                  border: tab === t.id ? '1px solid rgba(74,203,191,0.3)' : '1px solid transparent',
                }}>
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Chat Tab */}
        {tab === 'chat' && (
          <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'rgba(10,18,30,0.97)', border: '1.5px solid rgba(234,0,234,0.3)' }}>
            {/* Messages */}
            <div className="h-[520px] overflow-y-auto p-5 space-y-4" style={{ background: 'linear-gradient(180deg, #080f18 0%, #0a1929 100%)' }}>
              <AnimatePresence initial={false}>
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #ea00ea, #4acbbf)', boxShadow: '0 0 30px rgba(234,0,234,0.3)' }}>
                        <Sparkles className="h-8 w-8 text-white" />
                      </div>
                      <p className="text-sm" style={{ color: '#5e6a78' }}>Initializing GLYTCH...</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => <MsgBubble key={i} msg={msg} />)
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Quick prompts */}
            <div className="px-4 pt-3 flex flex-wrap gap-1.5" style={{ borderTop: '1px solid rgba(234,0,234,0.1)', background: 'rgba(8,15,24,0.8)' }}>
              {QUICK_FILTERS.slice(0, 4).map(f => (
                <button key={f.label}
                  onClick={() => { setInputText(f.query); }}
                  className="text-[10px] px-2.5 py-1 rounded-full transition-all"
                  style={{ background: 'rgba(234,0,234,0.08)', color: '#ea00ea', border: '1px solid rgba(234,0,234,0.2)' }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 flex gap-2" style={{ background: 'rgba(8,15,24,0.8)' }}>
              <Input
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask GLYTCH anything about your leads, content, or database..."
                disabled={isProcessing}
                style={{ background: '#071a2c', borderColor: 'rgba(234,0,234,0.3)', color: '#fff' }}
                className="flex-1 text-sm placeholder:text-gray-600" />
              <Button onClick={sendMessage} disabled={isProcessing || !inputText.trim()}
                style={{ background: isProcessing ? 'rgba(234,0,234,0.3)' : 'linear-gradient(135deg, #ea00ea, #4acbbf)', color: '#fff', flexShrink: 0 }}>
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Smart Search Tab */}
        {tab === 'search' && <SmartSearchPanel />}
      </div>
    </div>
  );
}