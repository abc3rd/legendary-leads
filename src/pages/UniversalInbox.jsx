import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox, Mail, MessageSquare, Globe, Send, Search, Loader2,
  RefreshCw, User, ChevronRight, CheckCircle2, Clock,
  Plus, Key, Trash2, ToggleRight, ToggleLeft, Zap, Link2, Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

// ─── Constants ────────────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: 'all',    label: 'All',    icon: Inbox,         color: '#ea00ea' },
  { id: 'email',  label: 'Email',  icon: Mail,          color: '#54b0e7' },
  { id: 'sms',    label: 'SMS',    icon: MessageSquare, color: '#4acbbf' },
  { id: 'social', label: 'Social', icon: Globe,         color: '#f8d417' },
];

const INTEGRATION_CATALOG = [
  { id: 'slack',      name: 'Slack',        color: '#4A154B', icon: '💬', desc: 'Receive Slack DMs and channel messages', fields: ['Bot Token', 'Channel ID'] },
  { id: 'whatsapp',   name: 'WhatsApp',     color: '#25D366', icon: '📱', desc: 'Connect WhatsApp Business API', fields: ['API Key', 'Phone Number ID'] },
  { id: 'messenger',  name: 'FB Messenger', color: '#0084FF', icon: '💙', desc: 'Facebook Messenger integration', fields: ['Page Access Token', 'Verify Token'] },
  { id: 'telegram',   name: 'Telegram',     color: '#2CA5E0', icon: '✈️', desc: 'Telegram Bot integration', fields: ['Bot Token'] },
  { id: 'twitter_dm', name: 'Twitter/X DMs',color: '#1DA1F2', icon: '🐦', desc: 'Direct message monitoring', fields: ['Bearer Token', 'API Secret'] },
  { id: 'hubspot',    name: 'HubSpot',      color: '#FF7A59', icon: '🧡', desc: 'Sync HubSpot contacts & conversations', fields: ['API Key'] },
  { id: 'zapier',     name: 'Zapier',       color: '#FF4A00', icon: '⚡', desc: 'Trigger from any Zapier workflow', fields: ['Webhook URL (auto-generated)'] },
  { id: 'make',       name: 'Make (Integromat)', color: '#6D4AFF', icon: '🔮', desc: 'Receive data from Make scenarios', fields: ['Webhook Secret'] },
  { id: 'custom',     name: 'Custom API',   color: '#ea00ea', icon: '🔌', desc: 'Connect any app via REST webhook', fields: ['Endpoint URL', 'Auth Header', 'Shared Secret'] },
];

const CARD = { background: 'linear-gradient(135deg, #0a1929 0%, #13202e 100%)', border: '1.5px solid rgba(234,0,234,0.18)' };
const STORAGE_KEY = 'll_inbox_integrations_v1';

function platformFromLog(log) {
  if (log.channel === 'email') return 'email';
  if (log.channel === 'sms') return 'sms';
  return 'social';
}
function platformFromNote(note) {
  if (note.activity_type === 'email_sent') return 'email';
  if (note.activity_type === 'sms_sent') return 'sms';
  return 'social';
}

// ─── Integration Manager ──────────────────────────────────────────────────────
function IntegrationManager() {
  const [integrations, setIntegrations] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [adding, setAdding] = useState(null); // catalog item
  const [form, setForm] = useState({});

  const save = (updated) => {
    setIntegrations(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const add = () => {
    const entry = { id: Date.now(), catalog_id: adding.id, name: adding.name, icon: adding.icon, color: adding.color, enabled: true, config: { ...form }, added_at: new Date().toISOString() };
    save([...integrations, entry]);
    setAdding(null);
    setForm({});
    toast.success(`${adding.name} integration added!`);
  };

  const toggle = (id) => save(integrations.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i));
  const remove = (id) => { if (!confirm('Remove this integration?')) return; save(integrations.filter(i => i.id !== id)); };

  const webhook_url = `${window.location.origin}/api/inbox-webhook`;

  return (
    <div className="space-y-5">
      {/* Connected integrations */}
      {integrations.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-3" style={{ color: '#4acbbf' }}>Connected Integrations ({integrations.length})</p>
          <div className="space-y-2">
            {integrations.map(intg => (
              <div key={intg.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${intg.enabled ? intg.color + '40' : 'rgba(255,255,255,0.07)'}` }}>
                <span className="text-xl flex-shrink-0">{intg.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#fff' }}>{intg.name}</p>
                  <p className="text-[10px]" style={{ color: '#5e6a78' }}>Added {new Date(intg.added_at).toLocaleDateString()}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: intg.enabled ? 'rgba(46,204,113,0.15)' : 'rgba(255,255,255,0.05)', color: intg.enabled ? '#2ecc71' : '#5e6a78' }}>
                  {intg.enabled ? 'Active' : 'Paused'}
                </span>
                <button onClick={() => toggle(intg.id)} style={{ color: intg.enabled ? '#4acbbf' : '#5e6a78' }}>
                  {intg.enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <button onClick={() => remove(intg.id)} style={{ color: '#f66c25' }}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Webhook info */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(234,0,234,0.06)', border: '1px solid rgba(234,0,234,0.2)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="h-4 w-4" style={{ color: '#ea00ea' }} />
          <p className="text-xs font-bold" style={{ color: '#ea00ea' }}>Your Universal Inbox Webhook</p>
        </div>
        <p className="text-xs mb-2" style={{ color: '#9ea7b5' }}>Use this URL to push messages from any external platform into the inbox:</p>
        <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: '#071a2c', border: '1px solid rgba(234,0,234,0.2)' }}>
          <code className="text-[10px] flex-1 truncate" style={{ color: '#4acbbf' }}>POST {webhook_url}</code>
          <button onClick={() => { navigator.clipboard.writeText(webhook_url); toast.success('Copied!'); }}
            className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(74,203,191,0.15)', color: '#4acbbf' }}>Copy</button>
        </div>
        <p className="text-[10px] mt-2" style={{ color: '#5e6a78' }}>Accepts: {'{ lead_id, message, channel, platform, metadata }'}</p>
      </div>

      {/* Catalog */}
      {!adding ? (
        <div>
          <p className="text-xs font-bold mb-3" style={{ color: '#f8d417' }}>
            <Zap className="h-3.5 w-3.5 inline mr-1" />Available Integrations
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {INTEGRATION_CATALOG.map(item => (
              <button key={item.id} onClick={() => { setAdding(item); setForm({}); }}
                className="flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.01]"
                style={{ background: `${item.color}10`, border: `1px solid ${item.color}30` }}>
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#fff' }}>{item.name}</p>
                  <p className="text-[10px]" style={{ color: '#9ea7b5' }}>{item.desc}</p>
                </div>
                <Plus className="h-4 w-4 flex-shrink-0 ml-auto" style={{ color: item.color }} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-5 space-y-3" style={{ background: `${adding.color}08`, border: `1.5px solid ${adding.color}40` }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{adding.icon}</span>
            <div>
              <p className="font-bold" style={{ color: '#fff' }}>Connect {adding.name}</p>
              <p className="text-xs" style={{ color: '#9ea7b5' }}>{adding.desc}</p>
            </div>
          </div>
          {adding.fields.map(field => (
            <div key={field}>
              <label className="text-xs block mb-1" style={{ color: '#9ea7b5' }}>{field}</label>
              {field.includes('auto-generated') ? (
                <div className="p-2 rounded-lg text-xs" style={{ background: '#071a2c', color: '#4acbbf', border: '1px solid #2a3a4a' }}>
                  Auto-generated on save
                </div>
              ) : (
                <Input value={form[field] || ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={field} type={field.toLowerCase().includes('token') || field.toLowerCase().includes('secret') || field.toLowerCase().includes('key') ? 'password' : 'text'}
                  style={{ background: '#071a2c', borderColor: `${adding.color}40`, color: '#fff' }} />
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <Button onClick={() => setAdding(null)} variant="ghost" className="flex-1" style={{ color: '#9ea7b5', border: '1px solid #2a3a4a' }}>Cancel</Button>
            <Button onClick={add} className="flex-1 font-semibold" style={{ background: adding.color, color: '#fff' }}>
              <Key className="h-4 w-4 mr-1.5" /> Connect
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UniversalInbox() {
  const qc = useQueryClient();
  const [platform, setPlatform] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const replyRef = useRef(null);

  useEffect(() => { base44.auth.me().then(u => setCurrentUser(u)).catch(() => {}); }, []);

  const { data: logs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['inbox_logs'],
    queryFn: () => base44.entities.FollowUpLog.list('-created_date', 200),
    refetchInterval: 30000,
  });
  const { data: notes = [], isLoading: notesLoading, refetch: refetchNotes } = useQuery({
    queryKey: ['inbox_notes'],
    queryFn: () => base44.entities.LeadNote.list('-created_date', 200),
    refetchInterval: 30000,
  });
  const { data: leads = [] } = useQuery({
    queryKey: ['inbox_leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 2000),
  });

  const refresh = () => { refetchLogs(); refetchNotes(); };

  const interactions = useMemo(() => {
    const fromLogs = logs.map(l => ({
      id: `log-${l.id}`, rawId: l.id, type: 'log',
      platform: platformFromLog(l), leadId: l.lead_id,
      leadUsername: l.lead_username || '', leadEmail: l.lead_email || '',
      subject: l.subject || l.sequence_name || 'Follow-up',
      body: l.body || '', status: l.status, date: l.created_date, channel: l.channel,
    }));
    const fromNotes = notes
      .filter(n => ['email_sent','sms_sent','note'].includes(n.activity_type))
      .map(n => ({
        id: `note-${n.id}`, rawId: n.id, type: 'note',
        platform: platformFromNote(n), leadId: n.lead_id,
        leadUsername: n.lead_username || n.lead_name || '', leadEmail: '',
        subject: n.activity_type === 'email_sent' ? 'Email' : n.activity_type === 'sms_sent' ? 'SMS' : 'Note',
        body: n.body || '', status: 'sent', date: n.created_date,
        author: n.author_name || n.author_email || '',
        channel: n.activity_type === 'email_sent' ? 'email' : n.activity_type === 'sms_sent' ? 'sms' : 'social',
      }));
    return [...fromLogs, ...fromNotes].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [logs, notes]);

  const filtered = useMemo(() => {
    let items = interactions;
    if (platform !== 'all') items = items.filter(i => i.platform === platform);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i => i.leadUsername?.toLowerCase().includes(q) || i.body?.toLowerCase().includes(q) || i.subject?.toLowerCase().includes(q));
    }
    return items;
  }, [interactions, platform, search]);

  const selectedLead = selected ? leads.find(l => l.id === selected.leadId) : null;

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    const lead = leads.find(l => l.id === selected.leadId);
    await base44.entities.LeadNote.create({
      lead_id: selected.leadId, lead_name: lead?.name || '',
      lead_username: selected.leadUsername || '',
      author_email: currentUser?.email || '', author_name: currentUser?.full_name || currentUser?.email || '',
      body: replyText.trim(),
      activity_type: selected.channel === 'email' ? 'email_sent' : selected.channel === 'sms' ? 'sms_sent' : 'note',
    });
    toast.success('Reply logged!');
    setReplyText('');
    qc.invalidateQueries({ queryKey: ['inbox_notes'] });
    setSending(false);
  };

  const counts = useMemo(() => {
    const result = { all: interactions.length, email: 0, sms: 0, social: 0 };
    interactions.forEach(i => { if (result[i.platform] !== undefined) result[i.platform]++; });
    return result;
  }, [interactions]);

  const isLoading = logsLoading || notesLoading;
  const platformColor = PLATFORMS.find(p => p.id === platform)?.color || '#ea00ea';

  return (
    <div className="min-h-screen p-3 sm:p-5" style={{ background: '#0a1929' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ea00ea, #4acbbf)', boxShadow: '0 0 18px rgba(234,0,234,0.35)' }}>
              <Inbox className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>Universal Inbox</h1>
              <p className="text-xs" style={{ color: '#9ea7b5' }}>All channels · API integrations · Multi-platform messaging</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={refresh} variant="ghost" style={{ color: '#4acbbf', border: '1px solid rgba(74,203,191,0.3)' }}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
            </Button>
          </div>
        </div>

        {/* Top tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {[
            { id: 'inbox', label: 'Inbox', icon: Inbox },
            { id: 'integrations', label: 'Integrations & API', icon: Settings },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: activeTab === t.id ? 'linear-gradient(135deg, #ea00ea22, #4acbbf22)' : 'transparent', color: activeTab === t.id ? '#ea00ea' : '#9ea7b5', border: activeTab === t.id ? '1px solid rgba(234,0,234,0.3)' : '1px solid transparent' }}>
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Inbox Tab */}
        {activeTab === 'inbox' && (
          <>
            {/* Platform Selector */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {PLATFORMS.map(p => {
                const Icon = p.icon;
                const active = platform === p.id;
                return (
                  <button key={p.id} onClick={() => setPlatform(p.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0"
                    style={{ background: active ? `${p.color}22` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${active ? p.color : 'rgba(255,255,255,0.08)'}`, color: active ? p.color : '#9ea7b5' }}>
                    <Icon className="h-4 w-4" />
                    {p.label}
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: active ? `${p.color}30` : 'rgba(255,255,255,0.06)', color: active ? p.color : '#5e6a78' }}>
                      {counts[p.id]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#5e6a78' }} />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by lead, subject, or message..."
                className="pl-9 text-sm placeholder:text-gray-600"
                style={{ background: '#071a2c', borderColor: 'rgba(234,0,234,0.25)', color: '#fff' }} />
            </div>

            {/* Two-panel */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Feed */}
              <div className="lg:col-span-2 space-y-2">
                {isLoading ? (
                  <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin" style={{ color: '#ea00ea' }} /></div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16 rounded-2xl" style={{ border: '2px dashed rgba(234,0,234,0.15)' }}>
                    <Inbox className="h-10 w-10 mx-auto mb-3" style={{ color: '#2a3a4a' }} />
                    <p className="text-sm font-semibold" style={{ color: '#9ea7b5' }}>No interactions found</p>
                    <p className="text-xs mt-1" style={{ color: '#5e6a78' }}>Try a different filter or connect an integration</p>
                    <Button size="sm" onClick={() => setActiveTab('integrations')} className="mt-3"
                      style={{ background: 'rgba(234,0,234,0.15)', color: '#ea00ea', border: '1px solid rgba(234,0,234,0.3)' }}>
                      <Settings className="h-3.5 w-3.5 mr-1" /> Add Integration
                    </Button>
                  </div>
                ) : (
                  filtered.map(item => {
                    const isActive = selected?.id === item.id;
                    const PlatIcon = PLATFORMS.find(p => p.id === item.platform)?.icon || Inbox;
                    const platColor = PLATFORMS.find(p => p.id === item.platform)?.color || '#ea00ea';
                    return (
                      <motion.div key={item.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        onClick={() => setSelected(item)}
                        className="rounded-xl p-3.5 cursor-pointer transition-all"
                        style={{ background: isActive ? `${platformColor}10` : 'rgba(255,255,255,0.03)', border: `1.5px solid ${isActive ? platformColor : 'rgba(255,255,255,0.07)'}` }}>
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${platColor}15` }}>
                            <PlatIcon className="h-3.5 w-3.5" style={{ color: platColor }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold truncate" style={{ color: '#fff' }}>@{item.leadUsername || 'Unknown'}</span>
                              <span className="text-[10px] flex-shrink-0" style={{ color: '#5e6a78' }}>
                                {item.date ? formatDistanceToNow(new Date(item.date), { addSuffix: true }) : ''}
                              </span>
                            </div>
                            <p className="text-xs font-medium mt-0.5 truncate" style={{ color: platColor }}>{item.subject}</p>
                            <p className="text-xs mt-0.5 truncate" style={{ color: '#9ea7b5' }}>{item.body?.slice(0, 80) || '—'}</p>
                          </div>
                          {isActive && <ChevronRight className="h-4 w-4 flex-shrink-0 mt-1" style={{ color: platformColor }} />}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Detail panel */}
              <div className="lg:col-span-3">
                <AnimatePresence mode="wait">
                  {!selected ? (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="h-96 lg:h-full rounded-2xl flex flex-col items-center justify-center" style={CARD}>
                      <Inbox className="h-12 w-12 mb-3" style={{ color: '#2a3a4a' }} />
                      <p className="font-semibold" style={{ color: '#9ea7b5' }}>Select an interaction</p>
                      <p className="text-xs mt-1" style={{ color: '#5e6a78' }}>Click any item on the left to view & reply</p>
                    </motion.div>
                  ) : (
                    <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl overflow-hidden flex flex-col" style={{ ...CARD, minHeight: '480px' }}>
                      {/* Header */}
                      <div className="p-4 flex items-start gap-3" style={{ borderBottom: '1px solid rgba(234,0,234,0.12)', background: 'rgba(234,0,234,0.04)' }}>
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                          style={{ background: 'linear-gradient(135deg, #ea00ea30, #4acbbf30)', color: '#4acbbf' }}>
                          {(selected.leadUsername?.[0] || '?').toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold" style={{ color: '#fff' }}>@{selected.leadUsername || 'Unknown'}</span>
                            {selectedLead?.name && <span className="text-xs" style={{ color: '#9ea7b5' }}>{selectedLead.name}</span>}
                            <span className="text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold ml-auto"
                              style={{ background: 'rgba(74,203,191,0.15)', color: '#4acbbf' }}>
                              {selected.platform}
                            </span>
                          </div>
                          <p className="text-sm font-semibold mt-1" style={{ color: '#ea00ea' }}>{selected.subject}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: '#5e6a78' }}>
                            {selected.author && <span>by {selected.author}</span>}
                            <span>{selected.date ? new Date(selected.date).toLocaleString() : ''}</span>
                            <span className="flex items-center gap-1">
                              {selected.status === 'sent' ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3" />}
                              {selected.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Lead context */}
                      {selectedLead && (
                        <div className="px-4 py-2.5 flex items-center gap-4 text-xs" style={{ background: 'rgba(248,212,23,0.04)', borderBottom: '1px solid rgba(248,212,23,0.1)' }}>
                          <User className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#f8d417' }} />
                          <span style={{ color: '#9ea7b5' }}>Status: <span style={{ color: '#fff' }}>{selectedLead.status?.replace(/_/g,' ')}</span></span>
                          {selectedLead.category && <span style={{ color: '#9ea7b5' }}>Niche: <span style={{ color: '#f8d417' }}>{selectedLead.category}</span></span>}
                          {selectedLead.lead_grade && <span style={{ color: '#9ea7b5' }}>Grade: <strong style={{ color: selectedLead.lead_grade === 'A' ? '#2ecc71' : '#f8d417' }}>{selectedLead.lead_grade}</strong></span>}
                          {selectedLead.followerCount > 0 && <span style={{ color: '#9ea7b5' }}>{(selectedLead.followerCount/1000).toFixed(0)}K followers</span>}
                          {selectedLead.sentiment && <span style={{ color: selectedLead.sentiment === 'Positive' ? '#2ecc71' : selectedLead.sentiment === 'Negative' ? '#f66c25' : '#9ea7b5' }}>😊 {selectedLead.sentiment}</span>}
                        </div>
                      )}

                      {/* Body */}
                      <div className="flex-1 p-5 overflow-y-auto" style={{ background: 'rgba(8,15,24,0.6)' }}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#d7dde5' }}>
                          {selected.body || <span style={{ color: '#5e6a78' }}>No message content</span>}
                        </p>
                      </div>

                      {/* Reply */}
                      <div className="p-4" style={{ borderTop: '1px solid rgba(234,0,234,0.15)', background: 'rgba(8,15,24,0.8)' }}>
                        <p className="text-[10px] font-semibold mb-2" style={{ color: '#9ea7b5' }}>
                          REPLY via {selected.platform.toUpperCase()} · logged as activity
                        </p>
                        <div className="flex gap-2">
                          <textarea ref={replyRef} value={replyText} onChange={e => setReplyText(e.target.value)} rows={3}
                            placeholder={`Reply to @${selected.leadUsername}…`}
                            className="flex-1 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none"
                            style={{ background: '#071a2c', border: '1px solid rgba(234,0,234,0.3)', color: '#fff' }}
                            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleReply(); }} />
                          <Button onClick={handleReply} disabled={sending || !replyText.trim()} className="self-end"
                            style={{ background: 'linear-gradient(135deg, #ea00ea, #4acbbf)', color: '#fff', flexShrink: 0 }}>
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-[10px] mt-1.5" style={{ color: '#5e6a78' }}>⌘ + Enter to send</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="max-w-3xl">
            <div className="rounded-2xl p-6" style={CARD}>
              <div className="flex items-center gap-3 mb-5">
                <Key className="h-5 w-5" style={{ color: '#f8d417' }} />
                <div>
                  <h2 className="text-lg font-bold" style={{ color: '#f8d417', fontFamily: 'Poppins, sans-serif' }}>Integrations & API Keys</h2>
                  <p className="text-xs" style={{ color: '#9ea7b5' }}>Connect external messaging platforms · Zapier · Make · Custom webhooks</p>
                </div>
              </div>
              <IntegrationManager />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}