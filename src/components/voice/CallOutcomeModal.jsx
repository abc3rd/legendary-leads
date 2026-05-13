import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, Phone } from 'lucide-react';
import { toast } from 'sonner';

const OUTCOMES = [
  { id: 'interested',      label: '🔥 Interested',       color: '#2ecc71' },
  { id: 'callback',        label: '📞 Wants Callback',    color: '#54b0e7' },
  { id: 'voicemail',       label: '📬 Left Voicemail',    color: '#f8d417' },
  { id: 'not_interested',  label: '❌ Not Interested',    color: '#e74c3c' },
  { id: 'no_answer',       label: '📵 No Answer',         color: '#e67e22' },
  { id: 'converted',       label: '🎉 Converted!',        color: '#ea00ea' },
];

export default function CallOutcomeModal({ callLog, onClose, onSubmit }) {
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!outcome) { toast.error('Please select an outcome'); return; }
    setSubmitting(true);
    try {
      await base44.functions.invoke('processCallOutcome', {
        callLogId: callLog.id,
        outcome,
        callNotes: notes,
        durationSeconds: parseInt(duration) || 0,
      });
      toast.success('Call outcome saved! Follow-up scheduled if applicable.');
      onSubmit();
    } catch (err) {
      toast.error('Failed to save outcome');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)', border: '2px solid rgba(234,0,234,0.4)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ea00ea, #9b59b6)' }}>
            <Phone className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: '#fff' }}>Log Call Outcome</p>
            <p className="text-xs" style={{ color: '#9ea7b5' }}>{callLog.lead_name || callLog.lead_username}</p>
          </div>
        </div>

        <p className="text-xs font-semibold mb-2" style={{ color: '#9ea7b5' }}>How did the call go?</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {OUTCOMES.map(o => (
            <button key={o.id} onClick={() => setOutcome(o.id)}
              className="rounded-xl px-3 py-2.5 text-xs font-semibold transition-all text-left"
              style={{
                background: outcome === o.id ? `${o.color}20` : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${outcome === o.id ? o.color : '#2a3a4a'}`,
                color: outcome === o.id ? o.color : '#9ea7b5',
              }}>
              {o.label}
            </button>
          ))}
        </div>

        <div className="mb-3">
          <p className="text-xs font-semibold mb-1" style={{ color: '#9ea7b5' }}>Call Duration (seconds)</p>
          <input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="e.g. 120"
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: '#071a2c', color: '#fff', border: '1px solid #2a3a4a' }}
          />
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold mb-1" style={{ color: '#9ea7b5' }}>Call Notes (used for sentiment analysis)</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="What did they say? How did they respond?..."
            className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
            style={{ background: '#071a2c', color: '#fff', border: '1px solid #2a3a4a' }}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1 text-sm" style={{ color: '#9ea7b5' }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !outcome} className="flex-1 text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #ea00ea, #9b59b6)', color: '#fff' }}>
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Save & Schedule</>}
          </Button>
        </div>
      </div>
    </div>
  );
}