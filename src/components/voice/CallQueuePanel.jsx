import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, PhoneOff, Clock, CheckCircle2, AlertCircle, Loader2, Trash2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CallOutcomeModal from './CallOutcomeModal';

const STATUS_CONFIG = {
  queued:    { color: '#9ea7b5', icon: Clock,        label: 'Queued' },
  calling:   { color: '#f8d417', icon: Phone,         label: 'Calling…' },
  completed: { color: '#2ecc71', icon: CheckCircle2,  label: 'Completed' },
  no_answer: { color: '#e67e22', icon: PhoneOff,      label: 'No Answer' },
  failed:    { color: '#e74c3c', icon: AlertCircle,   label: 'Failed' },
  callback_requested: { color: '#54b0e7', icon: Phone, label: 'Callback' },
};

const OUTCOME_COLORS = {
  interested: '#2ecc71', callback: '#54b0e7', voicemail: '#f8d417',
  not_interested: '#e74c3c', no_answer: '#e67e22', converted: '#ea00ea', unknown: '#9ea7b5',
};

export default function CallQueuePanel() {
  const qc = useQueryClient();
  const [outcomeModal, setOutcomeModal] = useState(null); // callLog object

  const { data: callLogs = [], isLoading } = useQuery({
    queryKey: ['call_logs'],
    queryFn: () => base44.entities.CallLog.list('-created_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CallLog.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['call_logs'] }); toast.success('Removed from queue'); },
  });

  const startCallMutation = useMutation({
    mutationFn: async (log) => {
      await base44.entities.CallLog.update(log.id, { status: 'calling', called_at: new Date().toISOString() });
      return log;
    },
    onSuccess: (log) => {
      qc.invalidateQueries({ queryKey: ['call_logs'] });
      // Open outcome modal after a brief "calling" simulation
      setTimeout(() => setOutcomeModal(log), 600);
    },
  });

  const handleOutcomeSubmit = () => {
    setOutcomeModal(null);
    qc.invalidateQueries({ queryKey: ['call_logs'] });
  };

  const queued = callLogs.filter(c => c.status === 'queued');
  const history = callLogs.filter(c => c.status !== 'queued');

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#ea00ea' }} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Queue */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: '#f8d417' }}>
            📋 Call Queue ({queued.length})
          </h3>
        </div>
        {queued.length === 0 ? (
          <div className="rounded-xl py-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <Phone className="h-8 w-8 mx-auto mb-2 opacity-30" style={{ color: '#9ea7b5' }} />
            <p className="text-sm" style={{ color: '#9ea7b5' }}>No calls queued. Generate a script above to add leads.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {queued.map(log => (
              <div key={log.id} className="rounded-xl p-3 flex items-center gap-3"
                style={{ background: 'rgba(248,212,23,0.05)', border: '1px solid rgba(248,212,23,0.2)' }}>
                <div className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #ea00ea, #9b59b6)', color: '#fff' }}>
                  {(log.lead_name?.[0] || log.lead_username?.[0] || '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#fff' }}>{log.lead_name || log.lead_username}</p>
                  <p className="text-xs" style={{ color: '#9ea7b5' }}>{log.voice_profile} · {log.script_template}</p>
                  {log.lead_phone && <p className="text-xs" style={{ color: '#54b0e7' }}>{log.lead_phone}</p>}
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={() => startCallMutation.mutate(log)}
                    disabled={startCallMutation.isPending}
                    className="h-8 px-3 text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #2ecc71, #27ae60)', color: '#fff' }}>
                    <Play className="h-3 w-3 mr-1" /> Start
                  </Button>
                  <button onClick={() => deleteMutation.mutate(log.id)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'rgba(231,76,60,0.15)', color: '#e74c3c' }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#54b0e7' }}>📊 Call History ({history.length})</h3>
          <div className="space-y-2">
            {history.slice(0, 20).map(log => {
              const cfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.failed;
              const Icon = cfg.icon;
              return (
                <div key={log.id} className="rounded-xl p-3 flex items-start gap-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: 'rgba(84,176,231,0.15)', color: '#54b0e7' }}>
                    {(log.lead_name?.[0] || log.lead_username?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: '#fff' }}>{log.lead_name || log.lead_username}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${cfg.color}20`, color: cfg.color }}>
                        <Icon className="h-3 w-3 inline mr-0.5" />{cfg.label}
                      </span>
                      {log.outcome && log.outcome !== 'unknown' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${OUTCOME_COLORS[log.outcome] || '#9ea7b5'}20`, color: OUTCOME_COLORS[log.outcome] || '#9ea7b5' }}>
                          {log.outcome.replace(/_/g, ' ')}
                        </span>
                      )}
                      {log.sentiment && (
                        <span className="text-[10px]" style={{ color: log.sentiment === 'Positive' ? '#2ecc71' : log.sentiment === 'Negative' ? '#e74c3c' : '#9ea7b5' }}>
                          {log.sentiment === 'Positive' ? '😊' : log.sentiment === 'Negative' ? '😟' : '😐'} {log.sentiment}
                        </span>
                      )}
                    </div>
                    {log.sentiment_summary && (
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#9ea7b5' }}>{log.sentiment_summary}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {log.duration_seconds > 0 && (
                        <span className="text-[10px]" style={{ color: '#9ea7b5' }}>⏱ {Math.floor(log.duration_seconds / 60)}:{String(log.duration_seconds % 60).padStart(2,'0')}</span>
                      )}
                      {log.follow_up_date && (
                        <span className="text-[10px]" style={{ color: '#f8d417' }}>📅 Follow-up: {log.follow_up_date}</span>
                      )}
                      {log.called_at && (
                        <span className="text-[10px]" style={{ color: '#5e6a78' }}>{new Date(log.called_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {outcomeModal && (
        <CallOutcomeModal
          callLog={outcomeModal}
          onClose={() => setOutcomeModal(null)}
          onSubmit={handleOutcomeSubmit}
        />
      )}
    </div>
  );
}