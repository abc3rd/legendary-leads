import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Mic, Play, Loader2, CheckCircle2, ChevronDown, ChevronUp,
  Sparkles, Phone, MessageSquare, User, BarChart2, List
} from 'lucide-react';
import { toast } from 'sonner';
import CallQueuePanel from '@/components/voice/CallQueuePanel';
import CallStatsBar from '@/components/voice/CallStatsBar';

const VOICE_PROFILES = [
  { id: 'professional_male', label: 'Alex – Professional Male', tone: 'Confident & direct', emoji: '👔' },
  { id: 'warm_female',       label: 'Sophia – Warm Female',     tone: 'Friendly & approachable', emoji: '😊' },
  { id: 'energetic_male',    label: 'Marcus – Energetic Male',  tone: 'High energy & persuasive', emoji: '⚡' },
  { id: 'calm_female',       label: 'Luna – Calm Female',       tone: 'Calm & trustworthy', emoji: '🌙' },
];

const SCRIPT_TEMPLATES = [
  {
    id: 'cold_intro', name: 'Cold Introduction', status: 'new',
    script: `Hi {{lead.name}}, this is [Your Name] reaching out about an exciting opportunity for {{lead.category}} creators like yourself. I'd love to connect and share how we've been helping creators in your space grow their revenue. Would you be open to a quick 5-minute call this week? Feel free to call me back at your convenience.`,
  },
  {
    id: 'follow_up', name: 'Follow-Up Message', status: 'contacted',
    script: `Hey {{lead.name}}, just following up from our earlier conversation. I know you're busy with your {{lead.category}} content, so I'll keep this brief. I have some new information I think you'll find really valuable. Give me a call back when you get a chance — I promise it'll be worth your time.`,
  },
  {
    id: 'qualified_pitch', name: 'Qualified Lead Pitch', status: 'qualified',
    script: `Hi {{lead.name}}, this is [Your Name] again. Based on our conversation, I've put together a tailored proposal for your {{lead.category}} brand with {{lead.followerCount}} followers. The numbers are really compelling and I'd love to walk you through it. Please give me a call back as soon as possible.`,
  },
  {
    id: 'negotiation_push', name: 'Negotiation Close', status: 'in_negotiation',
    script: `{{lead.name}}, hi — just checking in on the proposal we discussed. I want to make sure all your questions are answered and we can finalize the details. This offer is available for a limited time and I'd hate for you to miss out. Call me back at your earliest convenience and we'll get this wrapped up today.`,
  },
  {
    id: 'win_back', name: 'Win-Back / Re-Engagement', status: 'unresponsive',
    script: `Hi {{lead.name}}, I know it's been a while since we last connected — no worries at all. I just wanted to reach out one more time because we have a new offer specifically for {{lead.category}} creators that I think you'll love. If you're interested, give me a call back. If not, no pressure.`,
  },
];

const STATUS_COLORS = {
  new: '#4acbbf', contacted: '#54b0e7', qualified: '#f8d417',
  in_negotiation: '#9b59b6', unresponsive: '#5e6a78',
};

function fillPlaceholders(script, lead) {
  return script
    .replace(/{{lead\.name}}/g, lead?.name || lead?.username || 'there')
    .replace(/{{lead\.username}}/g, lead?.username || '')
    .replace(/{{lead\.category}}/g, lead?.category || 'your niche')
    .replace(/{{lead\.followerCount}}/g, lead?.followerCount?.toLocaleString() || 'your audience');
}

const TABS = [
  { id: 'generate', label: 'Generate Script', icon: Mic },
  { id: 'queue',    label: 'Call Queue & History', icon: List },
  { id: 'stats',    label: 'Analytics', icon: BarChart2 },
];

export default function VoiceOutreach() {
  const [activeTab, setActiveTab] = useState('generate');
  const [selectedVoice, setSelectedVoice] = useState(VOICE_PROFILES[0].id);
  const [selectedScript, setSelectedScript] = useState(SCRIPT_TEMPLATES[0].id);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const qc = useQueryClient();

  const { data: leads = [] } = useQuery({
    queryKey: ['leads_voice'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500),
  });

  const filteredLeads = useMemo(() => {
    if (!statusFilter) return leads;
    return leads.filter(l => l.status === statusFilter);
  }, [leads, statusFilter]);

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const script = SCRIPT_TEMPLATES.find(s => s.id === selectedScript);
  const voice = VOICE_PROFILES.find(v => v.id === selectedVoice);
  const filledScript = script && selectedLead ? fillPlaceholders(script.script, selectedLead) : script?.script || '';

  const queueMutation = useMutation({
    mutationFn: (scriptText) => base44.entities.CallLog.create({
      lead_id: selectedLead.id,
      lead_name: selectedLead.name || selectedLead.username,
      lead_username: selectedLead.username,
      lead_phone: selectedLead.phone,
      lead_category: selectedLead.category,
      voice_profile: voice?.label,
      script_template: script?.name,
      script_text: scriptText,
      status: 'queued',
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['call_logs'] });
      toast.success('Added to call queue!');
      setActiveTab('queue');
    },
  });

  const handleGenerate = async () => {
    if (!selectedLeadId) { toast.error('Please select a lead'); return; }
    setGenerating(true);
    setResult(null);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional voice coach. A sales rep needs to record a personalized voice message for this lead.

Voice Profile: ${voice?.label} — ${voice?.tone}
Script template:
"${filledScript}"

Rewrite this as a natural, highly personalized, conversational version matching the voice profile tone. Make it feel human, not scripted. Keep it under 45 seconds spoken (90-110 words). Return only the final script text.`,
      });
      setResult({ script: response, voice: voice?.label, lead: selectedLead?.name || selectedLead?.username, timestamp: new Date().toLocaleTimeString() });
      toast.success('Voice script generated!');
    } catch {
      toast.error('Failed to generate script');
    }
    setGenerating(false);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#0a1929' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ea00ea, #9b59b6)' }}>
            <Mic className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#ea00ea', fontFamily: 'Poppins, sans-serif' }}>Voice Outreach</h1>
            <p className="text-xs" style={{ color: '#9ea7b5' }}>AI-personalized outbound calling with sentiment analysis & auto follow-up</p>
          </div>
        </div>

        {/* Stats Bar always visible */}
        <CallStatsBar />

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 flex-1 justify-center px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: active ? 'rgba(234,0,234,0.2)' : 'transparent',
                  color: active ? '#ea00ea' : '#9ea7b5',
                  border: active ? '1px solid rgba(234,0,234,0.35)' : '1px solid transparent',
                }}>
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* GENERATE TAB */}
        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 space-y-4">
              {/* Voice Profile */}
              <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)', border: '1.5px solid rgba(234,0,234,0.3)' }}>
                <h2 className="text-sm font-bold mb-3" style={{ color: '#ea00ea' }}>Voice Profile</h2>
                <div className="space-y-2">
                  {VOICE_PROFILES.map(v => (
                    <button key={v.id} onClick={() => setSelectedVoice(v.id)}
                      className="w-full text-left rounded-lg px-3 py-2.5 transition-all"
                      style={{
                        background: selectedVoice === v.id ? 'rgba(234,0,234,0.15)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${selectedVoice === v.id ? '#ea00ea' : '#2a3a4a'}`,
                      }}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{v.emoji}</span>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: selectedVoice === v.id ? '#ea00ea' : '#d7dde5' }}>{v.label}</p>
                          <p className="text-[10px]" style={{ color: '#9ea7b5' }}>{v.tone}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lead Selection */}
              <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)', border: '1.5px solid rgba(84,176,231,0.3)' }}>
                <h2 className="text-sm font-bold mb-3" style={{ color: '#54b0e7' }}>Select Lead</h2>
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setSelectedLeadId(''); }}
                  className="w-full rounded-lg px-3 py-2 text-xs mb-2 outline-none"
                  style={{ background: '#071a2c', color: '#d7dde5', border: '1px solid #2a3a4a' }}>
                  <option value="">All Statuses</option>
                  {['new','cold_outreach','contacted','qualified','in_negotiation','unresponsive'].map(s => (
                    <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                  ))}
                </select>
                <select value={selectedLeadId} onChange={e => setSelectedLeadId(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-xs outline-none"
                  style={{ background: '#071a2c', color: '#d7dde5', border: '1px solid #2a3a4a' }}>
                  <option value="">Choose a lead…</option>
                  {filteredLeads.map(l => (
                    <option key={l.id} value={l.id}>{l.name || l.username}{l.category ? ` · ${l.category}` : ''}</option>
                  ))}
                </select>
                {selectedLead && (
                  <div className="mt-3 rounded-lg p-2.5" style={{ background: 'rgba(84,176,231,0.08)', border: '1px solid rgba(84,176,231,0.2)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-3.5 w-3.5" style={{ color: '#54b0e7' }} />
                      <span className="text-xs font-semibold" style={{ color: '#fff' }}>{selectedLead.name || selectedLead.username}</span>
                    </div>
                    <p className="text-[10px]" style={{ color: '#9ea7b5' }}>{selectedLead.category} · {selectedLead.followerCount?.toLocaleString()} followers</p>
                    <p className="text-[10px] mt-0.5" style={{ color: STATUS_COLORS[selectedLead.status] || '#888' }}>{selectedLead.status?.replace(/_/g,' ')}</p>
                    {selectedLead.phone && <p className="text-[10px] mt-0.5" style={{ color: '#4acbbf' }}>📞 {selectedLead.phone}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {/* Script Templates */}
              <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)', border: '1.5px solid rgba(248,212,23,0.3)' }}>
                <h2 className="text-sm font-bold mb-3" style={{ color: '#f8d417' }}>Script Template</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {SCRIPT_TEMPLATES.map(s => (
                    <button key={s.id} onClick={() => setSelectedScript(s.id)}
                      className="text-left rounded-lg px-3 py-2.5 transition-all"
                      style={{
                        background: selectedScript === s.id ? 'rgba(248,212,23,0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${selectedScript === s.id ? '#f8d417' : '#2a3a4a'}`,
                      }}>
                      <p className="text-xs font-semibold" style={{ color: selectedScript === s.id ? '#f8d417' : '#d7dde5' }}>{s.name}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: STATUS_COLORS[s.status] || '#9ea7b5' }}>for: {s.status.replace(/_/g,' ')} leads</p>
                    </button>
                  ))}
                </div>
                <button onClick={() => setPreviewOpen(o => !o)} className="flex items-center gap-1.5 text-xs mb-2" style={{ color: '#9ea7b5' }}>
                  {previewOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {previewOpen ? 'Hide' : 'Preview'} filled script
                </button>
                {previewOpen && (
                  <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ background: '#071a2c', color: '#d7dde5', border: '1px solid #1a2a3a' }}>
                    {filledScript}
                  </div>
                )}
              </div>

              <Button onClick={handleGenerate} disabled={generating || !selectedLeadId}
                className="w-full py-5 text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #ea00ea 0%, #9b59b6 100%)', color: '#fff', opacity: (!selectedLeadId || generating) ? 0.6 : 1 }}>
                {generating
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating AI Script…</>
                  : <><Sparkles className="h-4 w-4 mr-2" />Generate Personalized Voice Script</>}
              </Button>

              {result && (
                <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #0d1f0d 0%, #0a2a1a 100%)', border: '2px solid #2ecc71' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" style={{ color: '#2ecc71' }} />
                      <span className="text-sm font-bold" style={{ color: '#2ecc71' }}>Script Ready</span>
                    </div>
                    <div className="text-xs" style={{ color: '#9ea7b5' }}>
                      <span style={{ color: '#ea00ea' }}>{result.voice}</span> · {result.lead} · {result.timestamp}
                    </div>
                  </div>
                  <div className="rounded-lg p-3 mb-3 text-sm leading-relaxed" style={{ background: 'rgba(0,0,0,0.3)', color: '#d7dde5' }}>
                    {result.script}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => { navigator.clipboard.writeText(result.script); toast.success('Copied!'); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(46,204,113,0.15)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.3)' }}>
                      <CheckCircle2 className="h-3 w-3" /> Copy
                    </button>
                    <button
                      onClick={() => queueMutation.mutate(result.script)}
                      disabled={queueMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(234,0,234,0.15)', color: '#ea00ea', border: '1px solid rgba(234,0,234,0.3)' }}>
                      {queueMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Phone className="h-3 w-3" />}
                      Add to Call Queue
                    </button>
                    <button onClick={() => toast.info('Connect a VOIP provider in Settings to enable live calling.')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(84,176,231,0.12)', color: '#54b0e7', border: '1px solid rgba(84,176,231,0.25)' }}>
                      <Phone className="h-3 w-3" /> Trigger Call
                    </button>
                    <button onClick={() => toast.info('Connect Instagram DM in Settings to send direct messages.')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(155,89,182,0.12)', color: '#9b59b6', border: '1px solid rgba(155,89,182,0.25)' }}>
                      <MessageSquare className="h-3 w-3" /> Send as DM
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QUEUE TAB */}
        {activeTab === 'queue' && <CallQueuePanel />}

        {/* STATS TAB */}
        {activeTab === 'stats' && <CallAnalytics logs={[]} />}
      </div>
    </div>
  );
}

// Inline mini analytics for Stats tab
function CallAnalytics() {
  const { data: logs = [] } = useQuery({
    queryKey: ['call_logs'],
    queryFn: () => base44.entities.CallLog.list('-created_date', 200),
  });

  const outcomeCounts = logs.reduce((acc, l) => {
    if (l.outcome) acc[l.outcome] = (acc[l.outcome] || 0) + 1;
    return acc;
  }, {});

  const sentimentCounts = logs.reduce((acc, l) => {
    if (l.sentiment) acc[l.sentiment] = (acc[l.sentiment] || 0) + 1;
    return acc;
  }, {});

  const OUTCOME_COLORS = {
    interested: '#2ecc71', callback: '#54b0e7', voicemail: '#f8d417',
    not_interested: '#e74c3c', no_answer: '#e67e22', converted: '#ea00ea', unknown: '#9ea7b5',
  };
  const SENTIMENT_COLORS = { Positive: '#2ecc71', Neutral: '#f8d417', Negative: '#e74c3c' };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#f8d417' }}>Call Outcomes</h3>
          {Object.keys(outcomeCounts).length === 0 ? (
            <p className="text-xs" style={{ color: '#9ea7b5' }}>No data yet</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(outcomeCounts).map(([outcome, count]) => {
                const total = logs.filter(l => l.outcome).length;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={outcome}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs capitalize" style={{ color: '#d7dde5' }}>{outcome.replace(/_/g,' ')}</span>
                      <span className="text-xs font-bold" style={{ color: OUTCOME_COLORS[outcome] || '#9ea7b5' }}>{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: OUTCOME_COLORS[outcome] || '#9ea7b5' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#ea00ea' }}>Sentiment Breakdown</h3>
          {Object.keys(sentimentCounts).length === 0 ? (
            <p className="text-xs" style={{ color: '#9ea7b5' }}>No sentiment data yet. Add call notes when logging outcomes.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(sentimentCounts).map(([s, count]) => {
                const total = logs.filter(l => l.sentiment).length;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={s}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: '#d7dde5' }}>{s === 'Positive' ? '😊' : s === 'Negative' ? '😟' : '😐'} {s}</span>
                      <span className="text-xs font-bold" style={{ color: SENTIMENT_COLORS[s] }}>{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: SENTIMENT_COLORS[s] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent completed calls with follow-up */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: '#54b0e7' }}>Scheduled Follow-Ups</h3>
        {logs.filter(l => l.follow_up_scheduled && l.follow_up_date).length === 0 ? (
          <p className="text-xs" style={{ color: '#9ea7b5' }}>No follow-ups scheduled yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.filter(l => l.follow_up_scheduled && l.follow_up_date).slice(0, 10).map(log => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(84,176,231,0.2)', color: '#54b0e7' }}>
                  {(log.lead_name?.[0] || '?').toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold" style={{ color: '#fff' }}>{log.lead_name || log.lead_username}</p>
                  <p className="text-[10px]" style={{ color: '#9ea7b5' }}>Outcome: {log.outcome?.replace(/_/g,' ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold" style={{ color: '#f8d417' }}>{log.follow_up_date}</p>
                  <p className="text-[10px]" style={{ color: log.sentiment === 'Positive' ? '#2ecc71' : log.sentiment === 'Negative' ? '#e74c3c' : '#9ea7b5' }}>{log.sentiment || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}