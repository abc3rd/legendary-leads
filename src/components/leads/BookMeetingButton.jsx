import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Copy, Check, ExternalLink, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const OMEGA = {
  bg: '#0d0d1a',
  border: 'rgba(234,0,234,0.25)',
  magenta: '#ea00ea',
  teal: '#00c2e0',
  muted: '#7a7a8c',
};

const MEETING_TYPES = [
  { id: 'discovery', label: 'Discovery Call', duration: '30 min', emoji: '🔍' },
  { id: 'demo', label: 'Product Demo', duration: '45 min', emoji: '🎯' },
  { id: 'strategy', label: 'Strategy Session', duration: '60 min', emoji: '🧠' },
  { id: 'followup', label: 'Follow-Up', duration: '20 min', emoji: '📞' },
];

export default function BookMeetingButton({ lead }) {
  const [open, setOpen] = useState(false);
  const [meetingType, setMeetingType] = useState('discovery');
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    const mt = MEETING_TYPES.find(m => m.id === meetingType);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a personalized meeting invitation message for the following lead:

Name: ${lead.name || 'there'}
Username: @${lead.username || ''}
Category: ${lead.category || 'their niche'}
Bio: ${lead.bio || ''}
Followers: ${lead.followerCount || 0}
Meeting Type: ${mt.label} (${mt.duration})

Write a short, professional but friendly meeting request message (2-3 sentences max) that:
1. References their specific niche/content area
2. Mentions the value they'd get from the meeting
3. Includes a placeholder [CALENDLY_LINK] where the scheduling link should go

Also generate a compelling email subject line.

Return JSON with keys: subject (string), message (string), calendar_link_placeholder (string = "[CALENDLY_LINK]")`,
      response_json_schema: {
        type: 'object',
        properties: {
          subject: { type: 'string' },
          message: { type: 'string' },
          calendar_link_placeholder: { type: 'string' },
        },
      },
    });
    setGenerated(result);
    setLoading(false);
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return (
    <Button
      size="sm"
      onClick={() => setOpen(true)}
      className="text-xs"
      style={{ background: 'linear-gradient(135deg, #0057ff, #00c2e0)', color: '#fff', border: 'none' }}
    >
      <Calendar className="h-3.5 w-3.5 mr-1" /> Book Meeting
    </Button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl p-5" style={{ background: '#0d0d1a', border: `2px solid ${OMEGA.magenta}` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg" style={{ color: OMEGA.magenta, fontFamily: 'Poppins, sans-serif' }}>
            Book Meeting
          </h3>
          <button onClick={() => { setOpen(false); setGenerated(null); }}><X className="h-5 w-5" style={{ color: OMEGA.muted }} /></button>
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold mb-2" style={{ color: OMEGA.muted }}>
            For: <span style={{ color: '#fff' }}>{lead.name || `@${lead.username}`}</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {MEETING_TYPES.map(mt => (
              <button
                key={mt.id}
                onClick={() => { setMeetingType(mt.id); setGenerated(null); }}
                className="rounded-xl p-3 text-left transition-all"
                style={{
                  background: meetingType === mt.id ? 'rgba(234,0,234,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${meetingType === mt.id ? OMEGA.magenta : OMEGA.border}`,
                }}
              >
                <div className="text-lg mb-0.5">{mt.emoji}</div>
                <div className="text-xs font-semibold" style={{ color: meetingType === mt.id ? OMEGA.magenta : '#fff' }}>{mt.label}</div>
                <div className="text-[10px]" style={{ color: OMEGA.muted }}>{mt.duration}</div>
              </button>
            ))}
          </div>
        </div>

        {!generated ? (
          <Button onClick={generate} disabled={loading} className="w-full font-bold"
            style={{ background: 'linear-gradient(135deg, #ea00ea, #00c2e0)', color: '#fff' }}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating…</> : <><Calendar className="h-4 w-4 mr-2" /> Generate Invite</>}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OMEGA.border}` }}>
              <p className="text-[10px] font-semibold mb-1" style={{ color: OMEGA.muted }}>SUBJECT</p>
              <p className="text-sm font-semibold" style={{ color: '#fff' }}>{generated.subject}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${OMEGA.border}` }}>
              <p className="text-[10px] font-semibold mb-1" style={{ color: OMEGA.muted }}>MESSAGE</p>
              <p className="text-sm" style={{ color: '#e0e0e0' }}>{generated.message}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => copy(`Subject: ${generated.subject}\n\n${generated.message}`)}
                className="flex-1 text-xs font-semibold"
                style={{ background: 'rgba(234,0,234,0.15)', color: OMEGA.magenta, border: `1px solid ${OMEGA.magenta}` }}
              >
                {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                Copy Message
              </Button>
              <Button
                onClick={() => lead.email && window.open(`mailto:${lead.email}?subject=${encodeURIComponent(generated.subject)}&body=${encodeURIComponent(generated.message.replace('[CALENDLY_LINK]', 'YOUR_CALENDLY_LINK'))}`, '_blank')}
                className="flex-1 text-xs font-semibold"
                style={{ background: 'linear-gradient(135deg, #0057ff, #00c2e0)', color: '#fff' }}
                disabled={!lead.email}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Send Email
              </Button>
            </div>
            <Button onClick={() => setGenerated(null)} variant="ghost" className="w-full text-xs" style={{ color: OMEGA.muted }}>
              Regenerate
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}