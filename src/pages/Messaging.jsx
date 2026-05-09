import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Plus, Search, Circle, ArrowLeft, Loader2, MessageSquare, User } from 'lucide-react';

const OMEGA = {
  bg: '#0d0d1a',
  card: 'linear-gradient(135deg, #0d0d1a 0%, #111128 100%)',
  border: 'rgba(234,0,234,0.25)',
  magenta: '#ea00ea',
  teal: '#00c2e0',
  silver: '#c3c3c3',
  muted: '#7a7a8c',
};

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Messaging() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [newMsg, setNewMsg] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [composing, setComposing] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.User.list().then(setUsers).catch(() => {});
  }, []);

  const { data: allMessages = [], isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 200),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (user) {
      const unsub = base44.entities.Message.subscribe((event) => {
        qc.invalidateQueries({ queryKey: ['messages'] });
      });
      return () => unsub();
    }
  }, [user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread, allMessages]);

  // Build threads
  const threads = React.useMemo(() => {
    if (!user) return [];
    const myMsgs = allMessages.filter(
      m => m.sender_email === user.email || m.recipient_email === user.email
    );
    const threadMap = {};
    myMsgs.forEach(m => {
      const other = m.sender_email === user.email ? m.recipient_email : m.sender_email;
      const otherName = m.sender_email === user.email ? m.recipient_name : m.sender_name;
      if (!threadMap[other]) {
        threadMap[other] = { email: other, name: otherName || other, messages: [], unread: 0 };
      }
      threadMap[other].messages.push(m);
      if (!m.is_read && m.recipient_email === user.email) threadMap[other].unread++;
    });
    return Object.values(threadMap).sort((a, b) => {
      const aLast = a.messages[0]?.created_date || '';
      const bLast = b.messages[0]?.created_date || '';
      return bLast.localeCompare(aLast);
    });
  }, [allMessages, user]);

  const threadMessages = React.useMemo(() => {
    if (!selectedThread || !user) return [];
    return allMessages.filter(
      m => (m.sender_email === user.email && m.recipient_email === selectedThread) ||
           (m.recipient_email === user.email && m.sender_email === selectedThread)
    ).sort((a, b) => a.created_date?.localeCompare(b.created_date));
  }, [allMessages, selectedThread, user]);

  // Mark messages as read when thread opens
  useEffect(() => {
    if (!selectedThread || !user) return;
    threadMessages.forEach(m => {
      if (!m.is_read && m.recipient_email === user.email) {
        base44.entities.Message.update(m.id, { is_read: true });
      }
    });
  }, [selectedThread, threadMessages.length]);

  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);

  const sendMessage = async () => {
    if ((!newMsg.trim()) || sending) return;
    const to = composing ? composeTo : selectedThread;
    if (!to || !user) return;
    setSending(true);
    const toUser = users.find(u => u.email === to);
    await base44.entities.Message.create({
      sender_email: user.email,
      sender_name: user.full_name,
      recipient_email: to,
      recipient_name: toUser?.full_name || to,
      subject: newSubject || 'Message',
      body: newMsg.trim(),
      is_read: false,
    });
    setNewMsg('');
    setNewSubject('');
    if (composing) { setSelectedThread(to); setComposing(false); }
    setSending(false);
    qc.invalidateQueries({ queryKey: ['messages'] });
  };

  const filteredUsers = users.filter(u =>
    u.email !== user?.email &&
    (u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
     u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: OMEGA.bg }}>
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: OMEGA.magenta }} />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: OMEGA.bg }}>
      <div className="max-w-6xl mx-auto w-full p-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)' }}>
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: OMEGA.magenta, fontFamily: 'Poppins, sans-serif' }}>
              Secure Messaging
              {totalUnread > 0 && (
                <span className="ml-2 text-sm px-2 py-0.5 rounded-full font-bold" style={{ background: OMEGA.magenta, color: '#fff' }}>
                  {totalUnread}
                </span>
              )}
            </h1>
            <div className="flex items-center gap-1.5">
              <Circle className="h-2 w-2 fill-green-400" style={{ color: '#22c55e' }} />
              <span className="text-xs font-semibold" style={{ color: '#22c55e' }}>Active — {user.full_name}</span>
            </div>
          </div>
          <Button
            onClick={() => { setComposing(true); setSelectedThread(null); }}
            className="ml-auto font-semibold"
            style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)', color: '#fff' }}
          >
            <Plus className="h-4 w-4 mr-1" /> New Message
          </Button>
        </div>

        <div className="flex gap-4 flex-1 min-h-0" style={{ height: 'calc(100vh - 200px)' }}>
          {/* Thread List */}
          <div className="w-72 flex-shrink-0 rounded-2xl overflow-hidden flex flex-col" style={{ background: OMEGA.card, border: `1.5px solid ${OMEGA.border}` }}>
            <div className="p-3 border-b" style={{ borderColor: OMEGA.border }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: OMEGA.muted }} />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 text-xs h-8"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: OMEGA.border, color: '#fff' }}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" style={{ color: OMEGA.magenta }} /></div>
              ) : threads.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2" style={{ color: OMEGA.muted }} />
                  <p className="text-xs" style={{ color: OMEGA.muted }}>No conversations yet</p>
                </div>
              ) : (
                threads.map(t => (
                  <button
                    key={t.email}
                    onClick={() => { setSelectedThread(t.email); setComposing(false); }}
                    className="w-full text-left px-4 py-3 transition-all"
                    style={{
                      background: selectedThread === t.email ? 'rgba(234,0,234,0.12)' : 'transparent',
                      borderLeft: selectedThread === t.email ? `3px solid ${OMEGA.magenta}` : '3px solid transparent',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs"
                        style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)', color: '#fff' }}>
                        {(t.name?.[0] || t.email[0]).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold truncate" style={{ color: '#fff' }}>{t.name}</p>
                          {t.unread > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1 flex-shrink-0"
                              style={{ background: OMEGA.magenta, color: '#fff' }}>{t.unread}</span>
                          )}
                        </div>
                        <p className="text-[10px] truncate" style={{ color: OMEGA.muted }}>
                          {t.messages[0]?.body?.slice(0, 40)}…
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="flex-1 rounded-2xl flex flex-col overflow-hidden" style={{ background: OMEGA.card, border: `1.5px solid ${OMEGA.border}` }}>
            {composing ? (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: OMEGA.border }}>
                  <button onClick={() => setComposing(false)} style={{ color: OMEGA.muted }}>
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <h2 className="font-bold text-sm" style={{ color: OMEGA.magenta }}>New Message</h2>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: OMEGA.muted }}>To</label>
                    <select
                      value={composeTo}
                      onChange={e => setComposeTo(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: `1px solid ${OMEGA.border}` }}>
                      <option value="">Select a team member…</option>
                      {filteredUsers.map(u => (
                        <option key={u.email} value={u.email}>{u.full_name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: OMEGA.muted }}>Subject</label>
                    <Input
                      value={newSubject}
                      onChange={e => setNewSubject(e.target.value)}
                      placeholder="Subject…"
                      style={{ background: 'rgba(255,255,255,0.05)', borderColor: OMEGA.border, color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: OMEGA.muted }}>Message</label>
                    <textarea
                      value={newMsg}
                      onChange={e => setNewMsg(e.target.value)}
                      placeholder="Type your message…"
                      rows={6}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: `1px solid ${OMEGA.border}` }}
                    />
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={!composeTo || !newMsg.trim() || sending}
                    className="w-full font-bold"
                    style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)', color: '#fff' }}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Send
                  </Button>
                </div>
              </div>
            ) : selectedThread ? (
              <>
                <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: OMEGA.border }}>
                  <div className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)', color: '#fff' }}>
                    {(threads.find(t => t.email === selectedThread)?.name?.[0] || selectedThread[0]).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#fff' }}>
                      {threads.find(t => t.email === selectedThread)?.name || selectedThread}
                    </p>
                    <div className="flex items-center gap-1">
                      <Circle className="h-1.5 w-1.5 fill-green-400" style={{ color: '#22c55e' }} />
                      <span className="text-[10px]" style={{ color: '#22c55e' }}>Active</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {threadMessages.map((m, i) => {
                    const isMe = m.sender_email === user.email;
                    return (
                      <div key={m.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[70%]">
                          <div className="rounded-2xl px-4 py-2.5 text-sm"
                            style={{
                              background: isMe ? 'linear-gradient(135deg, #ea00ea, #9000ea)' : 'rgba(255,255,255,0.07)',
                              color: '#fff',
                              borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            }}>
                            {m.body}
                          </div>
                          <p className="text-[10px] mt-1 px-1" style={{ color: OMEGA.muted, textAlign: isMe ? 'right' : 'left' }}>
                            {timeAgo(m.created_date)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
                <div className="p-3 border-t flex gap-2" style={{ borderColor: OMEGA.border }}>
                  <Input
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a message…"
                    className="flex-1"
                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: OMEGA.border, color: '#fff' }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMsg.trim() || sending}
                    size="icon"
                    style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)' }}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(234,0,234,0.12)', border: `1px solid ${OMEGA.border}` }}>
                  <MessageSquare className="h-8 w-8" style={{ color: OMEGA.magenta }} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>Select a conversation</h3>
                <p className="text-sm mb-4" style={{ color: OMEGA.muted }}>or start a new message to connect with teammates</p>
                <Button
                  onClick={() => setComposing(true)}
                  style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)', color: '#fff' }}
                >
                  <Plus className="h-4 w-4 mr-2" /> Start Conversation
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}